import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
      SELECT id_etiqueta, nombre, color 
      FROM cat_etiquetas_avisos 
      WHERE activo = true 
      ORDER BY nombre ASC
    `;
        const etiquetas = await executeQuery(query);
        return NextResponse.json(etiquetas);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, color } = body;

        if (!nombre || !color) {
            return NextResponse.json({ error: 'Nombre y color son requeridos' }, { status: 400 });
        }

        const query = `
      INSERT INTO cat_etiquetas_avisos (nombre, color)
      VALUES ($1, $2)
      RETURNING *
    `;
        const result = await executeQuery(query, [nombre, color]);
        return NextResponse.json(result[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
