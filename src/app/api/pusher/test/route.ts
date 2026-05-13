import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST() {
    try {
        // Enviar notificación de prueba al canal de incapacidades
        await pusherServer.trigger("incapacidades-channel", "nueva-incapacidad", {
            tipo: "incapacidad",
            titulo: "🧪 Notificación de Prueba",
            mensaje: "Esta es una notificación de prueba del sistema Pusher - " + new Date().toLocaleTimeString('es-MX'),
            datos: {
                id_consulta: 9999,
                no_nomina: "TEST-001",
                dias: 3,
                folio_consulta: "TEST-2024-000001",
                test: true
            }
        });

        return NextResponse.json({
            success: true,
            message: "Notificación de prueba enviada exitosamente",
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Pusher error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Endpoint de prueba de Pusher",
        instructions: "Envía un POST a esta ruta para disparar una notificación de prueba",
        canal: "incapacidades-channel",
        evento: "nueva-incapacidad"
    });
}
