// src/app/api/alertas-fondos/enviar/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/db';
import { alertasFondosCorreos, inventarioMedicamentos, medicamentos, unidadesMedida } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { MedicamentoAlerta, ResumenAlertas } from '@/types/alertas-fondos';
import { calcularEstadoAlerta, calcularPorcentaje, calcularFaltante } from '@/types/alertas-fondos';
import { generarReporteFondosPDF } from '@/lib/generar-reporte-fondos-pdf';
import { enviarCorreo } from '@/lib/nodemailer';
import { generarEmailAlertaFondos, generarAsuntoAlerta } from '@/lib/templates/alerta-fondos-email';

// POST: Enviar alerta por correo a todos los destinatarios activos
export async function POST() {
  try {
    // 1. Obtener correos activos
    const correosActivos = await db
      .select()
      .from(alertasFondosCorreos)
      .where(eq(alertasFondosCorreos.activo, true));

    if (correosActivos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay destinatarios activos configurados para recibir alertas',
      }, { status: 400 });
    }

    // 2. Obtener inventario y calcular alertas
    const inventario = await db
      .select({
        id_inventario: inventarioMedicamentos.id_inventario,
        id_medicamento: inventarioMedicamentos.id_medicamento,
        existencia_actual: inventarioMedicamentos.existencia_actual,
        fondo_fijo: inventarioMedicamentos.fondo_fijo,
        nombre_comercial: medicamentos.nombre_comercial,
        sustancia_activa: medicamentos.sustancia_activa,
        clasificacion: medicamentos.clasificacion,
        medida: unidadesMedida.medida,
      })
      .from(inventarioMedicamentos)
      .innerJoin(medicamentos, eq(inventarioMedicamentos.id_medicamento, medicamentos.id_medicamento))
      .leftJoin(unidadesMedida, eq(medicamentos.id_medida, unidadesMedida.id_medida))
      .where(eq(medicamentos.activo, true));

    // Procesar medicamentos
    const medicamentosConAlerta: MedicamentoAlerta[] = [];
    let criticos = 0;
    let bajos = 0;
    let medios = 0;
    let normales = 0;

    for (const item of inventario) {
      const estado = calcularEstadoAlerta(item.existencia_actual, item.fondo_fijo);
      const porcentaje = calcularPorcentaje(item.existencia_actual, item.fondo_fijo);
      const faltante = calcularFaltante(item.existencia_actual, item.fondo_fijo);

      switch (estado) {
        case 'CRITICO': criticos++; break;
        case 'BAJO': bajos++; break;
        case 'MEDIO': medios++; break;
        case 'NORMAL': normales++; break;
      }

      if (estado !== 'NORMAL') {
        medicamentosConAlerta.push({
          id_inventario: item.id_inventario,
          id_medicamento: item.id_medicamento,
          nombre_comercial: item.nombre_comercial,
          sustancia_activa: item.sustancia_activa,
          existencia_actual: item.existencia_actual,
          fondo_fijo: item.fondo_fijo,
          faltante,
          porcentaje,
          estado,
          clasificacion: item.clasificacion,
          medida: item.medida || undefined,
        });
      }
    }

    // Verificar si hay alertas
    if (medicamentosConAlerta.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay medicamentos con alerta. No se enviaron correos.',
        destinatarios: 0,
      });
    }

    // Ordenar por prioridad
    medicamentosConAlerta.sort((a, b) => {
      const prioridad = { CRITICO: 1, BAJO: 2, MEDIO: 3 };
      const prioA = prioridad[a.estado as keyof typeof prioridad];
      const prioB = prioridad[b.estado as keyof typeof prioridad];
      if (prioA !== prioB) return prioA - prioB;
      return a.porcentaje - b.porcentaje;
    });

    const resumen: ResumenAlertas = {
      total_medicamentos: inventario.length,
      total_alertas: medicamentosConAlerta.length,
      criticos,
      bajos,
      medios,
      normales,
    };

    // 3. Generar PDF
    const pdfBytes = await generarReporteFondosPDF(medicamentosConAlerta, resumen);
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `reporte-alertas-inventario-${fecha}.pdf`;

    // 4. Generar asunto del correo
    const asunto = generarAsuntoAlerta(resumen);

    // 5. Enviar correos
    const erroresEnvio: string[] = [];
    let enviados = 0;

    for (const destinatario of correosActivos) {
      // Generar HTML personalizado para cada destinatario
      const htmlCorreo = generarEmailAlertaFondos({
        nombreDestinatario: destinatario.nombre_destinatario,
        fechaGeneracion: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        resumen,
        medicamentosCriticos: medicamentosConAlerta,
        urlSistema: process.env.NEXT_PUBLIC_APP_URL || undefined,
      });

      // Leer el logo para incrustarlo
      const logoPath = path.join(process.cwd(), 'public', 'logo_pandora.png');
      let logoAttachment = null;

      try {
        if (fs.existsSync(logoPath)) {
          logoAttachment = {
            filename: 'logo_pandora.png',
            content: fs.readFileSync(logoPath),
            cid: 'logo_pandora' // Mismo CID que en el template HTML
          };
        }
      } catch (e) {
        console.error('Error al leer el logo:', e);
      }

      // Enviar correo con PDF adjunto y logo incrustado
      const attachments: any[] = [
        {
          filename: nombreArchivo,
          content: Buffer.from(pdfBytes),
          contentType: 'application/pdf',
        },
      ];

      if (logoAttachment) {
        attachments.push(logoAttachment);
      }

      const resultado = await enviarCorreo({
        to: destinatario.correo,
        subject: asunto,
        html: htmlCorreo,
        attachments: attachments,
      });

      if (resultado.success) {
        enviados++;
        console.log(`Alerta enviada a: ${destinatario.correo}`);
      } else {
        erroresEnvio.push(`${destinatario.correo}: ${resultado.error}`);
        console.error(`Error al enviar a ${destinatario.correo}:`, resultado.error);
      }
    }

    // 6. Retornar resultado
    if (enviados === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo enviar ningún correo',
        errores: erroresEnvio,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Alerta enviada correctamente a ${enviados} destinatario(s)`,
      destinatarios: enviados,
      totalDestinatarios: correosActivos.length,
      alertas: {
        criticos: resumen.criticos,
        bajos: resumen.bajos,
        medios: resumen.medios,
        total: resumen.total_alertas,
      },
      ...(erroresEnvio.length > 0 && { errores: erroresEnvio }),
    });
  } catch (error: any) {
    console.error('Error al enviar alertas:', error);
    return NextResponse.json(
      { success: false, error: `Error al enviar alertas: ${error.message}` },
      { status: 500 }
    );
  }
}
