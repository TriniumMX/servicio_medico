import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Correct typing for Next.js 15+ dynamic params
) {
    try {
        const { id } = await params;

        const query = `
      UPDATE avisos 
      SET activo = false 
      WHERE id_aviso = $1
      RETURNING id_aviso
    `;

        await executeQuery(query, [id]);

        // Notificar eliminación (opcional, para limpiar UI en vivo)
        try {
            await pusherServer.trigger('avisos-channel', 'eliminar-aviso', { id_aviso: id });
        } catch (e) {
            console.error('Pusher error:', e);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
