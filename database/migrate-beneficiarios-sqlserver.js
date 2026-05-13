/**
 * MIGRACIÓN: Beneficiarios SQL Server → PostgreSQL Producción
 *
 * Ejecutar desde la raíz del proyecto:
 *   node database/migrate-beneficiarios-sqlserver.js
 */

const sql  = require('mssql');
const { Pool } = require('pg');

// ⚠️  SQL Server es SOLO LECTURA en este script.
//     No se ejecuta ningún INSERT, UPDATE, DELETE ni TRUNCATE contra SQL Server.
//     Toda escritura ocurre únicamente en PostgreSQL (destino).

// ── Configuración SQL Server (origen) ────────────────────────────────────────
const sqlServerConfig = {
  user:     'smedico',
  password: 'smedico21',
  server:   '172.16.0.7',
  database: 'PRESIDENCIA',
  options: {
    encrypt:                  false,
    trustServerCertificate:   true,
    requestTimeout:           60000,
    connectionTimeout:        30000,
  }
};

// ── Configuración PostgreSQL (destino) ────────────────────────────────────────
const pgConfig = {
  host:     'sanjuandelrio.sytes.net',
  port:     5432,
  user:     'postgres',
  password: 'AdminSJR@2025',
  database: 'servicio_medico_produccion',
  ssl:      false,
};

// ── Prefijo a remover de las URLs ─────────────────────────────────────────────
const URL_PREFIX = 'https://sanjuandelrio.sytes.net';

// ── Normalizar URL ─────────────────────────────────────────────────────────────
function normalizarUrl(valor) {
  if (!valor || typeof valor !== 'string') return null;
  const trimmed = valor.trim();
  if (!trimmed) return null;
  return trimmed.startsWith(URL_PREFIX)
    ? trimmed.slice(URL_PREFIX.length)
    : trimmed;
}

// ── Sanitizar CURP (debe tener exactamente 18 chars) ─────────────────────────
function sanitizarCurp(curp) {
  if (!curp) return null;
  const clean = curp.toString().trim().toUpperCase();
  if (clean.length === 18) return clean;
  if (clean.length > 18) return clean.slice(0, 18);
  return clean.padEnd(18, 'X'); // rellena si es más corta (raro, pero seguro)
}

// ── Sanitizar SEXO ────────────────────────────────────────────────────────────
function sanitizarSexo(sexo) {
  if (!sexo) return 'M';
  const s = sexo.toString().trim().toUpperCase();
  if (s === 'M' || s === 'F') return s;
  if (s === 'H' || s === 'HOMBRE' || s === 'MASCULINO') return 'M';
  if (s === 'MUJER' || s === 'FEMENINO') return 'F';
  return 'M';
}

// ── Sanitizar ACTIVO ──────────────────────────────────────────────────────────
function sanitizarActivo(activo) {
  if (!activo) return 'A';
  const a = activo.toString().trim().toUpperCase();
  if (a === 'A' || a === 'I') return a;
  if (a === 'S' || a === '1' || a === 'TRUE') return 'A';
  if (a === 'N' || a === '0' || a === 'FALSE') return 'I';
  return 'A';
}

// ── Sanitizar teléfono (máx 10 chars) ────────────────────────────────────────
function sanitizarTel(tel) {
  if (!tel) return null;
  const t = tel.toString().trim().replace(/\D/g, '').slice(0, 10);
  return t || null;
}

// ─────────────────────────────────────────────────────────────────────────────
async function migrar() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN BENEFICIARIOS: SQL Server → PostgreSQL');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  let sqlPool, pgPool;

  try {
    // ── Conectar a ambas BDs ──────────────────────────────────────────────────
    console.log('→ Conectando a SQL Server...');
    sqlPool = await sql.connect(sqlServerConfig);
    console.log('✓ SQL Server conectado');

    console.log('→ Conectando a PostgreSQL...');
    pgPool = new Pool(pgConfig);
    await pgPool.query('SELECT 1');
    console.log('✓ PostgreSQL conectado');
    console.log('');

    // ── Limpiar tabla destino (por si hay datos previos de prueba) ────────────
    console.log('→ Limpiando tabla beneficiarios en producción...');
    await pgPool.query('TRUNCATE TABLE beneficiarios RESTART IDENTITY CASCADE');
    console.log('✓ Tabla limpia, secuencia reiniciada');
    console.log('');

    // ── Leer beneficiarios desde SQL Server (SOLO LECTURA — no se modifica nada) ──
    console.log('→ Leyendo beneficiarios desde SQL Server (solo SELECT)...');
    const result = await sqlPool.request().query(`
      SELECT
        ID_BENEFICIARIO,
        NO_NOMINA,
        PARENTESCO,
        NOMBRE,
        A_PATERNO,
        A_MATERNO,
        SEXO,
        ESCOLARIDAD,
        F_NACIMIENTO,
        ACTIVO,
        ALERGIAS,
        SANGRE,
        TEL_EMERGENCIA,
        NOMBRE_EMERGENCIA,
        ESDISCAPACITADO,
        ESESTUDIANTE,
        VIGENCIA_ESTUDIOS,
        FOTO_URL,
        CURP,
        URL_CONSTANCIA,
        URL_CURP,
        URL_ACTA_NAC,
        URL_INE,
        URL_CONCUBINATO,
        URL_ACTAMATRIMONIO,
        URL_NOISSTE,
        URL_INCAP,
        URL_ACTADEPENDENCIAECONOMICA,
        DESCRIPTOR_FACIAL,
        FIRMA,
        MOTIVO
      FROM [PRESIDENCIA].[dbo].[BENEFICIARIO]
      ORDER BY ID_BENEFICIARIO
    `);

    const rows = result.recordset;
    console.log(`✓ ${rows.length} beneficiarios encontrados en SQL Server`);
    console.log('');

    // ── Insertar en lotes de 100 ──────────────────────────────────────────────
    const BATCH = 100;
    let insertados = 0;
    let omitidos   = 0;
    const errores  = [];

    // Deshabilitar FK y constraints temporalmente para inserción masiva
    const pgSetup = await pgPool.connect();
    await pgSetup.query('ALTER TABLE beneficiarios DISABLE TRIGGER ALL');
    pgSetup.release();
    console.log('✓ Constraints FK deshabilitados temporalmente');

    console.log(`→ Insertando en PostgreSQL (lotes de ${BATCH})...`);
    console.log('');

    for (let i = 0; i < rows.length; i += BATCH) {
      const lote = rows.slice(i, i + BATCH);
      const pgClient = await pgPool.connect();

      try {
        await pgClient.query('BEGIN');

        for (const row of lote) {
          await pgClient.query('SAVEPOINT sp_row');
          try {
            await pgClient.query(`
              INSERT INTO beneficiarios (
                ID_BENEFICIARIO,
                NO_NOMINA,
                PARENTESCO,
                NOMBRE,
                A_PATERNO,
                A_MATERNO,
                SEXO,
                ESCOLARIDAD,
                F_NACIMIENTO,
                ACTIVO,
                ALERGIAS,
                SANGRE,
                TEL_EMERGENCIA,
                NOMBRE_EMERGENCIA,
                ESDISCAPACITADO,
                ESESTUDIANTE,
                VIGENCIA_ESTUDIOS,
                FOTO_URL,
                CURP,
                URL_CONSTANCIA,
                URL_CURP,
                URL_ACTA_NAC,
                URL_INE,
                URL_CONCUBINATO,
                URL_ACTAMATRIMONIO,
                URL_NOISSTE,
                URL_INCAP,
                URL_ACTADEPENDENCIAECONOMICA,
                DESCRIPTOR_FACIAL,
                FIRMA,
                MOTIVO
              )
              OVERRIDING SYSTEM VALUE
              VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31
              )
            `, [
              row.ID_BENEFICIARIO,
              row.NO_NOMINA        ? row.NO_NOMINA.toString().trim()        : null,
              row.PARENTESCO,
              row.NOMBRE           ? row.NOMBRE.toString().trim()           : '',
              row.A_PATERNO        ? row.A_PATERNO.toString().trim()        : '',
              row.A_MATERNO        ? row.A_MATERNO.toString().trim()        : '',
              sanitizarSexo(row.SEXO),
              row.ESCOLARIDAD      ? row.ESCOLARIDAD.toString().trim()      : null,
              row.F_NACIMIENTO     ? new Date(row.F_NACIMIENTO)             : null,
              sanitizarActivo(row.ACTIVO),
              row.ALERGIAS         ? row.ALERGIAS.toString().trim()         : null,
              row.SANGRE           ? row.SANGRE.toString().trim()           : null,
              sanitizarTel(row.TEL_EMERGENCIA),
              row.NOMBRE_EMERGENCIA ? row.NOMBRE_EMERGENCIA.toString().trim() : null,
              row.ESDISCAPACITADO  ?? false,
              row.ESESTUDIANTE     ?? false,
              row.VIGENCIA_ESTUDIOS ? new Date(row.VIGENCIA_ESTUDIOS)       : null,
              normalizarUrl(row.FOTO_URL),
              sanitizarCurp(row.CURP),
              normalizarUrl(row.URL_CONSTANCIA),
              normalizarUrl(row.URL_CURP),
              normalizarUrl(row.URL_ACTA_NAC),
              normalizarUrl(row.URL_INE),
              normalizarUrl(row.URL_CONCUBINATO),
              normalizarUrl(row.URL_ACTAMATRIMONIO),
              normalizarUrl(row.URL_NOISSTE),
              normalizarUrl(row.URL_INCAP),
              normalizarUrl(row.URL_ACTADEPENDENCIAECONOMICA),
              row.DESCRIPTOR_FACIAL ? row.DESCRIPTOR_FACIAL.toString()     : null,
              row.FIRMA             ? row.FIRMA.toString()                  : null,
              row.MOTIVO            ? row.MOTIVO.toString().trim()          : null,
            ]);

            insertados++;
          } catch (rowErr) {
            await pgClient.query('ROLLBACK TO SAVEPOINT sp_row');
            omitidos++;
            errores.push({
              id:     row.ID_BENEFICIARIO,
              nomina: row.NO_NOMINA,
              nombre: `${row.NOMBRE} ${row.A_PATERNO}`,
              error:  rowErr.message,
            });
            // Mostrar los primeros 3 errores inmediatamente para diagnóstico
            if (errores.length <= 3) {
              console.error(`\n  ⚠ Error ID ${row.ID_BENEFICIARIO} (${row.NO_NOMINA}): ${rowErr.message}`);
            }
          }
        }

        await pgClient.query('COMMIT');

      } catch (batchErr) {
        await pgClient.query('ROLLBACK');
        console.error(`✗ Error en lote ${i}-${i + BATCH}:`, batchErr.message);
      } finally {
        pgClient.release();
      }

      // Progreso cada lote
      const pct = Math.round(((i + lote.length) / rows.length) * 100);
      process.stdout.write(`\r  Progreso: ${i + lote.length}/${rows.length} (${pct}%)`);
    }

    // ── Re-habilitar FK y constraints ────────────────────────────────────────
    const pgRestore = await pgPool.connect();
    await pgRestore.query('ALTER TABLE beneficiarios ENABLE TRIGGER ALL');
    pgRestore.release();
    console.log('\n✓ Constraints FK re-habilitados');

    // ── Sincronizar secuencia para que el próximo ID sea correcto ─────────────
    console.log('→ Sincronizando secuencia de IDs...');
    const maxId = await pgPool.query('SELECT MAX(id_beneficiario) as max FROM beneficiarios');
    if (maxId.rows[0].max) {
      await pgPool.query(`SELECT setval(pg_get_serial_sequence('beneficiarios', 'id_beneficiario'), $1)`, [maxId.rows[0].max]);
    }
    console.log('✓ Secuencia sincronizada');

    // ── Resumen final ─────────────────────────────────────────────────────────
    const { rows: countRows } = await pgPool.query('SELECT COUNT(*) FROM beneficiarios');
    const totalPg = parseInt(countRows[0].count);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RESULTADO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Total en SQL Server : ${rows.length}`);
    console.log(`  Insertados en PG    : ${insertados}`);
    console.log(`  Omitidos con error  : ${omitidos}`);
    console.log(`  Total en PG ahora   : ${totalPg}`);

    if (errores.length > 0) {
      console.log('');
      console.log(`  ⚠  Primeros errores (total: ${errores.length}):`);
      errores.slice(0, 10).forEach(e => {
        console.log(`     ID ${e.id} | ${e.nomina} | ${e.nombre}`);
        console.log(`       → ${e.error}`);
      });
    }

    console.log('');
    console.log(insertados === rows.length ? '  ✓ MIGRACIÓN COMPLETADA SIN ERRORES' : `  ⚠ MIGRACIÓN COMPLETADA CON ${omitidos} ERRORES`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

  } finally {
    // Asegurarse de re-habilitar FK aunque el script falle
    try {
      const c = await pgPool.connect();
      await c.query('ALTER TABLE beneficiarios ENABLE TRIGGER ALL');
      c.release();
    } catch (_) {}
    if (sqlPool) await sql.close();
    if (pgPool)  await pgPool.end();
  }
}

migrar().catch(err => {
  console.error('\n✗ Error fatal:', err.message);
  process.exit(1);
});
