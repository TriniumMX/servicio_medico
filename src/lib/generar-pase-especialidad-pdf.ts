import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ReferenciaEspecialidad } from '@/types/referencias';

/**
 * Genera el PDF de la Referencia a Especialidad usando el template
 * Incluye información completa del SOAP y tratamiento de la consulta origen
 */
export async function generarPaseEspecialidadPDF(referencia: ReferenciaEspecialidad): Promise<Uint8Array> {
    // 1. Cargar el template
    const templateBytes = await fetch('/formato_referencia.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Fuentes
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const colorText = rgb(0.1, 0.1, 0.1);
    const colorLabel = rgb(0.2, 0.2, 0.2);
    const colorAccent = rgb(0, 0.4, 0.7);
    const colorGray = rgb(0.5, 0.5, 0.5);

    // Función auxiliar para dibujar texto
    const draw = (text: string, x: number, y: number, size: number = 10, font = fontRegular, color = colorText) => {
        if (!text) return;
        page.drawText(text, { x, y, size, font, color });
    };

    // Función para manejar texto envuelto respetando saltos de línea manuales y automáticos
    const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, size: number = 9, font = fontRegular): number => {
        if (!text) return y;

        // Dividir por saltos de línea explícitos primero
        const paragraphs = text.split(/\r?\n/);
        let currentY = y;

        for (const paragraph of paragraphs) {
            const words = paragraph.split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                const w = font.widthOfTextAtSize(testLine, size);
                if (w > maxWidth && line.length > 0) {
                    draw(line.trim(), x, currentY, size, font);
                    line = word + ' ';
                    currentY -= lineHeight;
                } else {
                    line = testLine;
                }
            }
            if (line.trim()) {
                draw(line.trim(), x, currentY, size, font);
                currentY -= lineHeight;
            }
        }
        return currentY;
    };

    // Helper para mover el cursor a una sección respetando su posición ideal (anchor)
    const moveToSection = (targetAnchorY: number, padding: number = 15) => {
        if (cursorY > targetAnchorY) {
            cursorY = targetAnchorY;
        } else {
            cursorY -= padding;
        }
    };

    // ANCLAS (Posiciones ideales fijas)
    // Se elimina Y_VITALS de la parte superior
    const Y_START = 705;
    const Y_PATIENT = 660;
    const Y_APPOINTMENT = 580; // Subimos un poco ya que quitamos vitales de arriba (antes 560)
    const Y_SOAP = 480;        // Start del bloque SOAP (antes 480)

    // Cursor vertical principal
    let cursorY = Y_START;

    // Título 'REFERENCIA' en la parte superior derecha
    const esSeguimiento = referencia.tipo_referencia === 'seguimiento';
    const numConsulta = referencia.numero_consulta;
    const titleText = 'REFERENCIA';
    const titleFontSize = 16;
    const titleWidth = fontBold.widthOfTextAtSize(titleText, titleFontSize);
    draw(titleText, width - 60 - titleWidth, cursorY + 30, titleFontSize, fontBold, colorAccent);

    // Indicador de seguimiento debajo del título
    if (esSeguimiento && numConsulta) {
        const ordinal = numConsulta === 2 ? '2ª' : numConsulta === 3 ? '3ª' : `${numConsulta}ª`;
        const segText = `SEGUIMIENTO · ${ordinal} CONSULTA`;
        const segFontSize = 8;
        const segWidth = fontBold.widthOfTextAtSize(segText, segFontSize);
        const colorAmber = rgb(0.9, 0.5, 0.1);
        draw(segText, width - 60 - segWidth, cursorY + 18, segFontSize, fontBold, colorAmber);
    }

    // ================= FECHA DE EMISIÓN =================
    const fechaEmision = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    draw(`${fechaEmision}`, 450, cursorY, 10, fontBold);

    // ================= DATOS DEL PACIENTE =================
    cursorY = Y_PATIENT;

    // Fila 1: Nombre y Nómina
    draw(`NOMBRE:`, 60, cursorY, 10, fontBold);
    draw(`${referencia.nombre_paciente}`, 115, cursorY, 10, fontRegular);
    draw(`NÓMINA:`, 400, cursorY, 10, fontBold);
    draw(`${referencia.no_nomina}`, 455, cursorY, 10, fontRegular);

    // Fila 2: Edad y Tipo
    cursorY -= 15;
    if (referencia.edad) {
        draw(`EDAD:`, 60, cursorY, 10, fontBold);
        draw(`${referencia.edad} años`, 100, cursorY, 10, fontRegular);
    }
    draw(`TIPO:`, 400, cursorY, 10, fontBold);
    draw(referencia.es_empleado ? `EMPLEADO / SINDICATO` : `BENEFICIARIO`, 435, cursorY, 10, fontRegular);

    // Fila 3: Departamento y Folio
    cursorY -= 15;
    const yBase = cursorY;
    draw(`DEPARTAMENTO:`, 60, yBase, 10, fontBold);

    cursorY = drawWrappedText(referencia.departamento || 'N/A', 150, yBase, 235, 10, 10, fontRegular);

    if (referencia.folio) {
        draw(`FOLIO:`, 400, yBase, 10, fontBold);
        draw(referencia.folio, 440, yBase, 11, fontBold, colorAccent);
    }

    // ================= DETALLES DE LA CITA (Anchored) =================
    // Ahora va antes de Signos Vitales/SOAP
    moveToSection(Y_APPOINTMENT, 20);
    // Línea separadora
    page.drawLine({ start: { x: 60, y: cursorY + 10 }, end: { x: width - 60, y: cursorY + 10 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

    draw(`ESPECIALIDAD SOLICITADA:`, 60, cursorY, 10, fontBold);
    draw(referencia.nombre_especialidad, 205, cursorY, 10, fontRegular, colorAccent);

    // Fecha y Hora
    draw(`FECHA Y HORA:`, 350, cursorY, 10, fontBold);
    let fechaTexto = 'PENDIENTE';
    if (referencia.fecha_cita) {
        const date = new Date(referencia.fecha_cita);
        fechaTexto = date.toLocaleString('es-MX', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
    }
    draw(fechaTexto, 440, cursorY, 9, fontRegular);

    cursorY -= 15;
    draw(`MÉDICO AGENDADO:`, 60, cursorY, 10, fontBold);
    draw(referencia.nombre_medico_asignado || 'PENDIENTE DE ASIGNACIÓN', 185, cursorY, 10, fontRegular);

    // ================= NOTA CLINICA (SOAP) (Anchored) =================
    moveToSection(Y_SOAP, 20);
    // Línea separadora
    page.drawLine({ start: { x: 60, y: cursorY + 15 }, end: { x: width - 60, y: cursorY + 15 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

    // HEADER SOAP
    draw(`NOTA CLÍNICA (SOAP)`, 60, cursorY, 10, fontBold, colorAccent);

    // ================= SIGNOS VITALES (Movidó aquí) =================
    // Se inserta JUSTO DEBAJO del título SOAP, antes del Subjetivo
    cursorY -= 15;
    draw(`SIGNOS VITALES:`, 60, cursorY, 9, fontBold);

    const signosVitales: string[] = [];
    if (referencia.ta_sistolica && referencia.ta_diastolica) signosVitales.push(`T/A: ${referencia.ta_sistolica}/${referencia.ta_diastolica}`);
    if (referencia.frecuencia_cardiaca) signosVitales.push(`FC: ${referencia.frecuencia_cardiaca}`);
    if (referencia.temperatura_c) signosVitales.push(`Temp: ${referencia.temperatura_c}°C`);
    if (referencia.oxigenacion) signosVitales.push(`SpO2: ${referencia.oxigenacion}%`);
    if (referencia.peso_kg) signosVitales.push(`Peso: ${referencia.peso_kg}kg`);
    if (referencia.altura_cm) signosVitales.push(`Talla: ${referencia.altura_cm}cm`);
    if (referencia.glucosa_mg_dl) signosVitales.push(`Glu: ${referencia.glucosa_mg_dl}`);

    if (signosVitales.length > 0) {
        draw(signosVitales.join('  |  '), 155, cursorY, 8, fontRegular);
    } else {
        draw('No registrados', 155, cursorY, 8, fontRegular, colorGray);
    }

    // Continuamos con contenido SOAP
    cursorY -= 15;

    // Subjetivo
    draw(`S - Subjetivo:`, 60, cursorY, 9, fontBold);
    if (referencia.subjetivo) {
        cursorY = drawWrappedText(referencia.subjetivo, 145, cursorY, 400, 10, 8);
    } else {
        draw('No registrado', 145, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // Objetivo
    cursorY -= 5;
    draw(`O - Objetivo:`, 60, cursorY, 9, fontBold);
    if (referencia.objetivo) {
        cursorY = drawWrappedText(referencia.objetivo, 140, cursorY, 400, 10, 8);
    } else {
        draw('No registrado', 140, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // Diagnóstico
    cursorY -= 5;
    draw(`A - Diagnóstico:`, 60, cursorY, 9, fontBold);

    if (referencia.diagnosticos && referencia.diagnosticos.length > 0) {
        // Mostrar TODOS los diagnósticos
        for (const diag of referencia.diagnosticos) {
            const prefix = diag.es_principal ? '(Principal) ' : '• ';
            const fontDiag = diag.es_principal ? fontBold : fontRegular;
            // Dibujar código y tíulo
            // Si es muy largo, usar drawWrappedText
            const textoDiag = `${prefix}${diag.cie11_codigo} - ${diag.cie11_titulo}`;

            // Usamos drawWrappedText para manejar diagnósticos largos
            cursorY = drawWrappedText(textoDiag, 155, cursorY, 390, 10, 8, fontDiag);
            // Pequeño espacio extra entre diagnósticos
            cursorY -= 2;
        }
        // Ajuste final después de la lista
        cursorY -= 5;

    } else if (referencia.cie11_codigo && referencia.cie11_titulo) {
        // Fallback: mostrar el único diagnóstico que tenemos en los campos legacy
        draw(`${referencia.cie11_codigo} - ${referencia.cie11_titulo}`, 155, cursorY, 8, fontRegular);
        cursorY -= 10;
    } else if (referencia.analisis) {
        // Fallback: mostrar análisis si no hay diagnósticos CIE-11
        cursorY = drawWrappedText(referencia.analisis, 155, cursorY, 390, 10, 8);
    } else {
        draw('No registrado', 155, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // Plan
    cursorY -= 5;
    draw(`P - Plan:`, 60, cursorY, 9, fontBold);
    let planTexto = '';
    if (referencia.plan_tratamiento) {
        try {
            const planObj = JSON.parse(referencia.plan_tratamiento);
            const opciones: string[] = [];
            if (planObj.opciones?.medicamentos) opciones.push('Medicamentos');
            if (planObj.opciones?.incapacidad) opciones.push('Incapacidad');
            if (planObj.opciones?.laboratorio) opciones.push('Lab');
            if (planObj.opciones?.especialidad) opciones.push('Referencia');
            planTexto = opciones.length > 0 ? opciones.join(', ') : 'Sin tratamiento especificado';
        } catch {
            planTexto = 'Consultar detalles abajo';
        }
    }
    if (planTexto) {
        cursorY = drawWrappedText(planTexto, 115, cursorY, 430, 10, 8);
    } else {
        draw('No registrado', 115, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // ================= MOTIVO DE LA REFERENCIA =================
    cursorY -= 15;
    page.drawLine({ start: { x: 60, y: cursorY + 8 }, end: { x: width - 60, y: cursorY + 8 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

    draw(`MOTIVO DE LA REFERENCIA:`, 60, cursorY, 10, fontBold);
    draw(`Refiere: Dr(a). ${referencia.nombre_medico_refiere}`, 280, cursorY, 9, fontRegular);

    cursorY -= 15;
    const motivo = referencia.motivo_referencia || 'No especificado';
    cursorY = drawWrappedText(motivo, 60, cursorY, 480, 11, 9);


    // ================= TRATAMIENTO =================
    cursorY -= 15;
    page.drawLine({ start: { x: 60, y: cursorY + 8 }, end: { x: width - 60, y: cursorY + 8 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

    draw(`TRATAMIENTO INDICADO`, 60, cursorY, 10, fontBold, colorAccent);
    cursorY -= 15;

    // Medicamentos
    draw(`Medicamentos:`, 60, cursorY, 9, fontBold);
    if (referencia.medicamentos_recetados && referencia.medicamentos_recetados.length > 0) {
        const medsList = referencia.medicamentos_recetados.map(m =>
            `• ${m.nombre_comercial} (${m.sustancia_activa}) ${m.dosis} x ${m.duracion_tratamiento_dias}d`
        ).join('  ');

        cursorY = drawWrappedText(medsList, 140, cursorY, 400, 10, 8);
    } else {
        draw('Ninguno', 140, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // Estudios
    cursorY -= 2;
    draw(`Laboratorio:`, 60, cursorY, 9, fontBold);
    if (referencia.estudios_laboratorio && referencia.estudios_laboratorio.length > 0) {
        const estudiosTexto = referencia.estudios_laboratorio.map(e => e.nombre_estudio).join(', ');
        cursorY = drawWrappedText(estudiosTexto, 140, cursorY, 400, 10, 8);
    } else {
        draw('Ninguno', 140, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // Incapacidad
    cursorY -= 2;
    draw(`Incapacidad:`, 60, cursorY, 9, fontBold);
    if (referencia.incapacidad) {
        const inc = referencia.incapacidad;
        const textoInc = `${inc.dias_autorizados || inc.dias_sugeridos} días (${inc.fecha_inicio.split('T')[0]} a ${inc.fecha_fin.split('T')[0]})`;
        draw(textoInc, 140, cursorY, 8, fontRegular);
        cursorY -= 10;
    } else {
        draw('Ninguna', 140, cursorY, 8, fontRegular, colorGray);
        cursorY -= 10;
    }

    // ================= FIRMAS =================
    const ySign = 100;
    const yName = 75;

    page.drawLine({ start: { x: 60, y: ySign + 25 }, end: { x: width - 60, y: ySign + 25 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });

    if (referencia.nombre_coordinador) {
        if (referencia.firma_digital) {
            try {
                const firmaBytes = await fetch(referencia.firma_digital).then(res => res.arrayBuffer());
                const firmaImage = await pdfDoc.embedPng(firmaBytes).catch(() => pdfDoc.embedJpg(firmaBytes));
                if (firmaImage) {
                    const dims = firmaImage.scale(0.2);
                    page.drawImage(firmaImage, {
                        x: 80,
                        y: ySign - 10,
                        width: 100,
                        height: (100 / dims.width) * dims.height,
                    });
                }
            } catch (e) { }
        }
        draw('_______________________', 60, yName + 15, 10, fontRegular, colorGray);
        draw(referencia.nombre_coordinador, 60, yName, 8, fontRegular);
        draw(referencia.cargo_coordinador || 'Autorizó', 60, yName - 10, 7, fontRegular, colorGray);
    } else {
        draw("PENDIENTE DE AUTORIZACIÓN", 60, yName, 8, fontRegular, colorGray);
    }

    // Paciente
    draw('_______________________', 380, yName + 15, 10, fontRegular, colorGray);
    draw(referencia.nombre_paciente, 380, yName, 8, fontRegular);
    draw(`Firma del Paciente`, 380, yName - 10, 7, fontRegular, colorGray);

    return pdfDoc.save();
}
