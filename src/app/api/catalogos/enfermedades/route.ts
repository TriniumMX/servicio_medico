import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';

// GET: (Se queda igual, solo trae los datos)
export async function GET() {
  try {
    const enfermedades = await executeQuery(`SELECT * FROM enfermedades_cronicas ORDER BY nombre ASC`);
    const kpis = await executeQuery(`SELECT * FROM enfermedades_kpis WHERE activo = true`);

    const data = enfermedades.map((enf: any) => ({
      ...enf,
      kpis: kpis.filter((k: any) => k.id_enfermedad === enf.id_enfermedad)
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al obtener datos' }, { status: 500 });
  }
}

// POST: Crear
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, kpis } = body;

    if (!nombre) return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });

    // 1. Insertar Enfermedad
    const nuevaEnfermedad = await executeQueryOne<{ id_enfermedad: number }>(`
      INSERT INTO enfermedades_cronicas (nombre, descripcion, activo)
      VALUES ($1, $2, true) RETURNING id_enfermedad
    `, [nombre, descripcion]);

    const idEnfermedad = nuevaEnfermedad?.id_enfermedad;

    // 2. Insertar KPIs (SOLO NOMBRE)
    if (idEnfermedad && kpis && kpis.length > 0) {
      for (const kpi of kpis) {
        if (kpi.nombre_indicador) {
          await executeQuery(`
            INSERT INTO enfermedades_kpis (id_enfermedad, nombre_indicador, activo)
            VALUES ($1, $2, true)
          `, [idEnfermedad, kpi.nombre_indicador]);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Enfermedad registrada' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al guardar' }, { status: 500 });
  }
}

// PUT: Actualizar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_enfermedad, nombre, descripcion, kpis, activo } = body;

    // 1. Actualizar Enfermedad
    await executeQuery(`
      UPDATE enfermedades_cronicas 
      SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), activo = COALESCE($3, activo)
      WHERE id_enfermedad = $4
    `, [nombre, descripcion, activo, id_enfermedad]);

    // 2. Actualizar KPIs (Si se enviaron)
    if (Array.isArray(kpis)) {
      await executeQuery(`DELETE FROM enfermedades_kpis WHERE id_enfermedad = $1`, [id_enfermedad]);
      
      for (const kpi of kpis) {
        if (kpi.nombre_indicador) {
          await executeQuery(`
              INSERT INTO enfermedades_kpis (id_enfermedad, nombre_indicador, activo)
              VALUES ($1, $2, true)
          `, [id_enfermedad, kpi.nombre_indicador]);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Actualizado correctamente' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 });
  }
}