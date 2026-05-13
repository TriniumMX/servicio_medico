import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: NextRequest) {
  try {
    const result = await executeQuery(`
      SELECT 
        id_hospital, 
        nombre_hospital, 
        direccion, 
        contacto, 
        encargado, 
        razon_social, 
        activo, 
        fecha_creacion,
        latitud,
        longitud
      FROM hospitales 
      WHERE activo = true
      ORDER BY nombre_hospital ASC
    `);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Error al obtener hospitales:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar hospitales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nombre_hospital, 
      direccion, 
      contacto, 
      encargado, 
      razon_social,
      latitud,
      longitud 
    } = body;

    if (!nombre_hospital) {
      return NextResponse.json(
        { success: false, error: 'El nombre del hospital es requerido' },
        { status: 400 }
      );
    }

    await executeQuery(`
      INSERT INTO hospitales (
        nombre_hospital, direccion, contacto, encargado, razon_social, 
        activo, fecha_creacion, latitud, longitud
      ) VALUES ($1, $2, $3, $4, $5, true, NOW(), $6, $7)
    `, [
      nombre_hospital, 
      direccion, 
      contacto, 
      encargado, 
      razon_social,
      latitud || null,   // Si no selecciona mapa, guarda null
      longitud || null
    ]);

    return NextResponse.json({ success: true, message: 'Hospital registrado correctamente' });

  } catch (error: any) {
    console.error('❌ Error al crear hospital:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar el hospital' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un hospital existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id_hospital, 
      nombre_hospital, 
      direccion, 
      contacto, 
      encargado, 
      razon_social,
      latitud,
      longitud 
    } = body;

    if (!id_hospital) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    await executeQuery(`
      UPDATE hospitales SET
        nombre_hospital = $1,
        direccion = $2,
        contacto = $3,
        encargado = $4,
        razon_social = $5,
        latitud = $6,
        longitud = $7,
        fecha_modificacion = NOW()
      WHERE id_hospital = $8
    `, [
      nombre_hospital, 
      direccion, 
      contacto, 
      encargado, 
      razon_social,
      latitud || null,
      longitud || null,
      id_hospital
    ]);

    return NextResponse.json({ success: true, message: 'Hospital actualizado' });

  } catch (error: any) {
    console.error('❌ Error al actualizar:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE: Eliminar (Lógico o Físico)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo'); // 'logico' o 'fisico'

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    if (tipo === 'fisico') {
      // ELIMINACIÓN FÍSICA (Borrar de la BD)
      await executeQuery('DELETE FROM hospitales WHERE id_hospital = $1', [id]);
      return NextResponse.json({ success: true, message: 'Hospital eliminado permanentemente' });
    } else {
      // ELIMINACIÓN LÓGICA (Marcar activo = false)
      await executeQuery("UPDATE hospitales SET activo = false WHERE id_hospital = $1", [id]);
      return NextResponse.json({ success: true, message: 'Hospital dado de baja' });
    }

  } catch (error: any) {
    console.error('❌ Error al eliminar:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar' }, { status: 500 });
  }
}