import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referenciasEspecialidad } from "@/db/schema/referencias";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_referencia } = body;

    // Validar datos requeridos
    if (!id_referencia) {
      return NextResponse.json(
        { success: false, error: "El ID de la referencia es obligatorio" },
        { status: 400 }
      );
    }

    // Verificar que la referencia existe
    // Verificar que la referencia existe
    const referenciaExistente = await db
      .select()
      .from(referenciasEspecialidad)
      .where(eq(referenciasEspecialidad.idReferencia, id_referencia))
      .limit(1);

    if (referenciaExistente.length === 0) {
      return NextResponse.json(
        { success: false, error: "La referencia no existe" },
        { status: 404 }
      );
    }

    const referencia = referenciaExistente[0];

    // Validar que la referencia está en estatus correcto
    // Se permite desde 'notificada' (flujo completo) o 'asignada' (el hospital ya asignó pero admin no ha notificado al paciente)
    if (referencia.estatus !== "notificada" && referencia.estatus !== "asignada") {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede marcar como atendida. Estatus actual: ${referencia.estatus}`,
        },
        { status: 400 }
      );
    }

    // Actualizar la referencia a estatus "atendida"
    await db
      .update(referenciasEspecialidad)
      .set({
        estatus: "atendida",
        actualizadoEn: new Date(),
      })
      .where(eq(referenciasEspecialidad.idReferencia, id_referencia));

    return NextResponse.json({
      success: true,
      message: "Referencia marcada como atendida exitosamente",
    });
  } catch (error) {
    console.error("Error al marcar referencia como atendida:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al marcar la referencia como atendida",
      },
      { status: 500 }
    );
  }
}
