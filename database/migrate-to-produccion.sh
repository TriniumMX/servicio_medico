#!/bin/bash
# =============================================================================
#  MIGRACIÓN: servicio-medico-pruebas → servicio_medico_produccion
#  Ejecutar desde Git Bash: bash database/migrate-to-produccion.sh
# =============================================================================

set -e  # Detener si cualquier comando falla

# ── Conexión ──────────────────────────────────────────────────────────────────
HOST="sanjuandelrio.sytes.net"
PORT="5432"
USER="postgres"
export PGPASSWORD="AdminSJR@2025"

DB_ORIGEN="servicio-medico-pruebas"
DB_DESTINO="servicio_medico_produccion"

# ── Colores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
info() { echo -e "  ${CYAN}→${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; exit 1; }

# ── Verificar que pg_dump y psql están disponibles ────────────────────────────
command -v pg_dump >/dev/null 2>&1 || err "pg_dump no encontrado. Agrega PostgreSQL/bin a tu PATH."
command -v psql    >/dev/null 2>&1 || err "psql no encontrado. Agrega PostgreSQL/bin a tu PATH."

echo ""
echo "============================================================"
echo "  MIGRACIÓN A PRODUCCIÓN — Sistema Médico 2.0"
echo "  Origen  : $DB_ORIGEN"
echo "  Destino : $DB_DESTINO"
echo "  Servidor: $HOST:$PORT"
echo "============================================================"
echo ""

# ── Verificar conexión al origen ──────────────────────────────────────────────
info "Verificando conexión a origen ($DB_ORIGEN)..."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_ORIGEN" -c "SELECT 1" -q > /dev/null \
  || err "No se puede conectar a $DB_ORIGEN"
ok "Conexión a origen OK"

# ── Verificar conexión al destino ─────────────────────────────────────────────
info "Verificando conexión a destino ($DB_DESTINO)..."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -c "SELECT 1" -q > /dev/null \
  || err "No se puede conectar a $DB_DESTINO. Verifica que la BD exista."
ok "Conexión a destino OK"

# ── Confirmación antes de ejecutar ────────────────────────────────────────────
echo ""
warn "Esto REEMPLAZARÁ todas las tablas en '$DB_DESTINO'."
warn "Si ya tiene datos, se perderán."
echo ""
read -p "  ¿Continuar? (escribe 'SI' para confirmar): " CONFIRM
[ "$CONFIRM" = "SI" ] || { echo "  Cancelado."; exit 0; }
echo ""

# =============================================================================
# PASO 1: ESQUEMA COMPLETO (estructura vacía)
# =============================================================================
echo "────────────────────────────────────────────────────────────"
echo "  PASO 1/4 — Aplicando esquema completo"
echo "────────────────────────────────────────────────────────────"

info "Exportando esquema desde origen..."
pg_dump \
  -h "$HOST" -p "$PORT" -U "$USER" \
  --schema-only \
  --no-owner \
  --no-acl \
  --no-comments \
  "$DB_ORIGEN" > /tmp/sm_schema.sql

ok "Esquema exportado ($(wc -l < /tmp/sm_schema.sql) líneas)"

info "Aplicando esquema en destino..."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" \
  -f /tmp/sm_schema.sql -q
ok "Esquema aplicado en $DB_DESTINO"

# =============================================================================
# PASO 2: DATOS DE CATÁLOGOS (orden respeta dependencias de FK)
# =============================================================================
echo ""
echo "────────────────────────────────────────────────────────────"
echo "  PASO 2/4 — Migrando catálogos y configuración"
echo "────────────────────────────────────────────────────────────"

# Helper: copia datos de una tabla deshabilitando FK checks temporalmente
copy_table() {
  local TABLE="$1"
  local LABEL="${2:-$TABLE}"
  info "$LABEL..."
  pg_dump \
    -h "$HOST" -p "$PORT" -U "$USER" \
    --data-only \
    --disable-triggers \
    -t "$TABLE" \
    "$DB_ORIGEN" | \
  psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -q
  ok "$LABEL"
}

# ── Nivel 0: Sin dependencias ──────────────────────────────────────────────
copy_table "tiposusuarios"            "Tipos de usuario"
copy_table "especialidades"           "Especialidades médicas"
copy_table "parentesco"               "Tipos de parentesco"
copy_table "hospitales"               "Hospitales"
copy_table "cat_acciones"             "Catálogo de permisos/acciones"
copy_table "unidades_medida"          "Unidades de medida"
copy_table "reglas_generales"         "Reglas generales del sistema"
copy_table "estatus_consulta"         "Estatus de consulta"
copy_table "cat_etiquetas_avisos"     "Etiquetas de avisos"
copy_table "alertas_fondos_correos"   "Correos de alertas de stock"
copy_table "cat_estudios_laboratorio" "Catálogo de estudios de laboratorio (200+)"
copy_table "enfermedades_cronicas"    "Enfermedades crónicas"

# ── Nivel 1: Dependen de nivel 0 ──────────────────────────────────────────
copy_table "usuarios"          "Usuarios del sistema"
copy_table "medicamentos"      "Catálogo de medicamentos"
copy_table "enfermedades_kpis" "KPIs de enfermedades crónicas"

# ── Nivel 2: Dependen de nivel 1 ──────────────────────────────────────────
copy_table "beneficiario"      "Padrón de empleados y beneficiarios"
copy_table "usuario_acciones"  "Permisos asignados a usuarios"

# =============================================================================
# PASO 3: INVENTARIO (con existencia_actual = 0)
# =============================================================================
echo ""
echo "────────────────────────────────────────────────────────────"
echo "  PASO 3/4 — Inventario de medicamentos (stock inicial = 0)"
echo "────────────────────────────────────────────────────────────"

info "Copiando configuración de inventario desde origen..."
pg_dump \
  -h "$HOST" -p "$PORT" -U "$USER" \
  --data-only \
  --disable-triggers \
  -t "inventario_medicamentos" \
  "$DB_ORIGEN" | \
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -q

info "Reseteando existencia_actual a 0 (producción arranca en cero)..."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -q \
  -c "UPDATE inventario_medicamentos SET existencia_actual = 0;"

ok "Inventario listo: $(psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -tAc \
  "SELECT COUNT(*) FROM inventario_medicamentos;") medicamentos registrados con stock = 0"

# =============================================================================
# PASO 4: VERIFICACIÓN FINAL
# =============================================================================
echo ""
echo "────────────────────────────────────────────────────────────"
echo "  PASO 4/4 — Verificación"
echo "────────────────────────────────────────────────────────────"

verify_count() {
  local TABLE="$1"
  local COUNT
  COUNT=$(psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -tAc \
    "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "ERROR")
  printf "  %-40s %s registros\n" "$TABLE" "$COUNT"
}

echo ""
echo "  Tablas con datos en producción:"
echo ""
verify_count "tiposusuarios"
verify_count "especialidades"
verify_count "parentesco"
verify_count "hospitales"
verify_count "cat_acciones"
verify_count "cat_estudios_laboratorio"
verify_count "unidades_medida"
verify_count "reglas_generales"
verify_count "estatus_consulta"
verify_count "cat_etiquetas_avisos"
verify_count "usuarios"
verify_count "medicamentos"
verify_count "inventario_medicamentos"
verify_count "beneficiario"
verify_count "enfermedades_cronicas"
verify_count "enfermedades_kpis"
verify_count "usuario_acciones"

echo ""
echo "  Tablas transaccionales (deben estar en 0):"
echo ""
verify_count "consulta"
verify_count "recetas"
verify_count "incapacidades"
verify_count "referencias_especialidad"
verify_count "surtimientos_receta"
verify_count "firmas_digitales"
verify_count "agenda_medico"

# ── Limpieza ──────────────────────────────────────────────────────────────────
rm -f /tmp/sm_schema.sql

echo ""
echo "============================================================"
echo -e "  ${GREEN}MIGRACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo "============================================================"
echo ""
echo "  Próximos pasos:"
echo "  1. Actualiza .env.local: PGDATABASE=servicio_medico_produccion"
echo "  2. Reinicia la app: npm run dev"
echo "  3. Inicia sesión con el usuario admin (CATR27)"
echo "  4. Asigna permisos a usuarios desde /dashboard/admin/permisos"
echo "  5. Configura el stock inicial en /dashboard/farmacia/inventario"
echo ""
