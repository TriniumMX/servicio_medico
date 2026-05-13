import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { clave, descripcion } = await request.json();

        if (!clave || !descripcion) {
            return NextResponse.json(
                { success: false, error: 'Clave y descripción son requeridas' },
                { status: 400 }
            );
        }

        // Validar formato de clave (Mayúsculas y guiones bajos)
        const claveFormat = clave.toUpperCase().replace(/\s+/g, '_');

        // Verificar si ya existe
        const existing = await executeQuery(
            'SELECT id_accion FROM cat_acciones WHERE clave = $1',
            [claveFormat]
        );

        if (existing && existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Ya existe una acción con esa clave' },
                { status: 409 }
            );
        }

        // Insertar
        await executeQuery(
            'INSERT INTO cat_acciones (clave, descripcion, activo) VALUES ($1, $2, true)',
            [claveFormat, descripcion]
        );

        return NextResponse.json({
            success: true,
            message: 'Acción creada correctamente',
            nuevaAccion: { clave: claveFormat, descripcion }
        });

    } catch (error: any) {
        console.error('Error creando acción:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error interno' },
            { status: 500 }
        );
    }
}
