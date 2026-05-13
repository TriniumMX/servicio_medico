// src/app/api/referencias/hospital/medicos-disponibles/[id_especialidad]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import type {
  MedicoEspecialista,
  MedicosEspecialistasResponse
} from '@/types/referencias';

/**
 * GET - Obtener médicos especialistas disponibles por especialidad
 * Solo retorna especialistas del mismo hospital que el usuario de hospital logueado.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id_especialidad: string }> }
) {
  try {
    const { id_especialidad: idEspecialidad } = await params;

    if (!idEspecialidad) {
      return NextResponse.json(
        { success: false, error: 'ID de especialidad requerido' },
        { status: 400 }
      );
    }

    // Obtener hospital del usuario logueado
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret) as { payload: { id: number } };

    const usuarioData = await executeQueryOne<{ id_hospital: number | null }>(`
      SELECT id_hospital FROM usuarios WHERE id_usuario = $1
    `, [payload.id]);

    const idHospital = usuarioData?.id_hospital;

    if (!idHospital) {
      return NextResponse.json({ success: true, medicos: [] });
    }

    // Solo especialistas de la especialidad requerida Y del mismo hospital
    const medicos = await executeQuery<MedicoEspecialista>(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.cedula_profesional,
        u.id_especialidad,
        e.especialidad,
        u.email,
        u.telefono
      FROM usuarios u
      INNER JOIN especialidades e ON u.id_especialidad = e.claveespecialidad
      WHERE u.id_especialidad = $1
        AND u.id_hospital = $2
        AND u.activo = true
        AND u.id_tipousuario IN (2, 11)
      ORDER BY u.nombre ASC
    `, [idEspecialidad, idHospital]);

    const response: MedicosEspecialistasResponse = {
      success: true,
      medicos: medicos
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al obtener médicos especialistas:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
