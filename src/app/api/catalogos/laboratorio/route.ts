import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

// GET
export async function GET() {
  try {
    const result = await executeQuery(`
      SELECT
        e.id_estudio,
        e.nombre_estudio,
        e.categoria,
        e.costo,
        e.activo,
        e.id_hospital,
        h.nombre_hospital
      FROM cat_estudios_laboratorio e
      LEFT JOIN hospitales h ON e.id_hospital = h.id_hospital
      ORDER BY e.categoria ASC, e.nombre_estudio ASC
    `);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al obtener estudios' }, { status: 500 });
  }
}

// POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre_estudio, categoria, costo, id_hospital } = body;

    if (!nombre_estudio) return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });

    const existe = await executeQuery(
      `SELECT id_estudio FROM cat_estudios_laboratorio WHERE LOWER(nombre_estudio) = LOWER($1) AND id_hospital = $2`,
      [nombre_estudio, id_hospital || 5]
    );

    if (existe.length > 0) {
      return NextResponse.json({ success: false, error: 'Ya existe un estudio con este nombre en este hospital' }, { status: 400 });
    }

    await executeQuery(
      `INSERT INTO cat_estudios_laboratorio (nombre_estudio, categoria, costo, activo, id_hospital) VALUES ($1, $2, $3, true, $4)`,
      [nombre_estudio, categoria, costo || 0, id_hospital || 5]
    );

    return NextResponse.json({ success: true, message: 'Estudio registrado' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al guardar' }, { status: 500 });
  }
}

// PUT
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_estudio, nombre_estudio, categoria, costo, activo, id_hospital } = body;

    if (!id_estudio) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });

    await executeQuery(`
      UPDATE cat_estudios_laboratorio
      SET
        nombre_estudio = COALESCE($1, nombre_estudio),
        categoria = COALESCE($2, categoria),
        costo = COALESCE($3, costo),
        activo = COALESCE($4, activo),
        id_hospital = COALESCE($5, id_hospital)
      WHERE id_estudio = $6
    `, [nombre_estudio, categoria, costo, activo, id_hospital, id_estudio]);

    return NextResponse.json({ success: true, message: 'Actualizado correctamente' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 });
  }
}