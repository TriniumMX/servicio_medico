import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface LabOrderData {
    folio_consulta: string;
    paciente_nombre: string;
    no_nomina: string;
    departamento: string;
    edad?: number | string;
    fecha_autorizacion: string; // Fecha Elaboración (Solicitud/Autorización)
    fecha_entrega?: string;
    medico_solicitante: string;
    // motivo_clinico: string; // DEPRECATED - Now per-study
    motivo_clinico?: string; // Keep optional for backward compat/fallback
    diagnosticos?: { codigo: string; titulo: string; es_principal: boolean }[];
    estudios: { nombre_estudio: string; motivo_clinico?: string }[];
    coordinador_nombre: string;
    coordinador_firma?: string;
    medico_firma?: string;
    elaboro_nombre?: string;
}

export async function generarOrdenLaboratorioPDF(data: LabOrderData) {
    // 1. Cargar el template
    const formUrl = '/formato_laboratorio.pdf';
    const formPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(formPdfBytes);

    // 2. Preparar fuente
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();
    console.log("PDF Page Size:", width, height);

    // 3. Definir coordenadas base y offset para duplicado
    const halfWidth = width / 2;

    // Función helper para dibujar texto en ambas mitades
    const drawDual = (text: string, x: number, y: number, options: any = {}) => {
        if (!text) return;
        const txt = String(text);
        // Lado Izquierdo
        page.drawText(txt, { x, y, font, size: 9, color: rgb(0, 0, 0), ...options });
        // Lado Derecho (Offset)
        page.drawText(txt, { x: x + halfWidth, y, font, size: 9, color: rgb(0, 0, 0), ...options });
    };

    // Helper para texto centrado
    const drawCenteredDual = (text: string, xCenter: number, y: number, options: any = {}) => {
        if (!text) return;
        const txt = String(text);
        const size = options.size || 9;
        const textFont = options.font || font;
        const textWidth = textFont.widthOfTextAtSize(txt, size);
        const x = xCenter - (textWidth / 2);

        drawDual(txt, x, y, options);
    };

    // Función helper para imagenes en ambas mitades
    const kMaxW = 35;
    const kMaxH = 25;
    const drawSignatureCentered = async (imgBase64: string, xCenter: number, yBottom: number) => {
        if (!imgBase64) return;
        try {
            const pngImage = await pdfDoc.embedPng(imgBase64);
            const { width: imgW, height: imgH } = pngImage.scale(1);

            const scale = Math.min(kMaxW / imgW, kMaxH / imgH);
            const finalW = imgW * scale;
            const finalH = imgH * scale;

            const x = xCenter - (finalW / 2);

            page.drawImage(pngImage, { x, y: yBottom, width: finalW, height: finalH });
            page.drawImage(pngImage, { x: x + halfWidth, y: yBottom, width: finalW, height: finalH });
        } catch (e) {
            console.error("Error drawing signature", e);
        }
    };

    // --- DATOS DE LA CONSULTA (ESCALA PEQUEÑA: 252 x 144) ---
    const fontSizeMain = 2;
    const fontSizeSmall = 1.5;

    // --- CONFIGURACIÓN DE COORDENADAS ---
    const xFechaElab = 35;
    const yFechaElab = 123.5;
    const xNomina = 80.5;
    const yNomina = 123.5;
    const xFechaEntrega = 31.5;
    const yFechaEntrega = 120;
    const xFolioOrden = 83.5;
    const yFolioOrden = 120;
    const xConsulta = 105;
    const yConsulta = 120;
    const xDepto = 26;
    const yDepto = 116.5;
    const xPaciente = 28;
    const yPaciente = 106.2;
    const xEdad = 88;
    const yEdad = 106.2;
    const xDiagnostico = 15;
    const yDiagnostico = 94;
    const xCIE11 = 15;
    const yCIE11 = 94;
    const xEstudios = 15;
    let yEstudios = 78;

    // --- DIBUJADO DE DATOS ---

    // Fila 1
    drawDual(data.fecha_autorizacion ? new Date(data.fecha_autorizacion).toLocaleDateString() : '---', xFechaElab, yFechaElab, { size: fontSizeMain });
    drawDual(data.no_nomina || '---', xNomina, yNomina, { size: fontSizeMain });

    // Fila 2
    drawDual(data.fecha_entrega ? new Date(data.fecha_entrega).toLocaleDateString() : 'Pendiente', xFechaEntrega, yFechaEntrega, { size: fontSizeMain });
    drawDual(data.folio_consulta || '---', xFolioOrden, yFolioOrden, { size: fontSizeSmall });
    drawDual(data.folio_consulta || '---', xConsulta, yConsulta, { size: fontSizeSmall });

    // Fila 3
    drawDual(data.departamento || '---', xDepto, yDepto, { size: fontSizeSmall });

    // Datos Paciente
    drawDual(data.paciente_nombre || '---', xPaciente, yPaciente, { font: fontBold, size: fontSizeMain });
    drawDual(data.edad ? data.edad.toString() + ' años' : '---', xEdad, yEdad, { size: fontSizeMain });

    // Diagnósticos
    if (data.diagnosticos && data.diagnosticos.length > 0) {
        let currentYCIE11 = yCIE11;
        const limitY = 80;

        for (const diag of data.diagnosticos) {
            if (currentYCIE11 < limitY) break;
            const prefix = diag.es_principal ? '(P) ' : '';
            const text = `${prefix}${diag.codigo} - ${diag.titulo}`;
            drawDual(text, xCIE11, currentYCIE11, { maxWidth: 110, lineHeight: 2.5, size: fontSizeSmall, color: rgb(0.2, 0.2, 0.2) });
            currentYCIE11 -= 2.8;
        }
    } else {
        drawDual("Sin diagnóstico registrado", xDiagnostico, yDiagnostico, { size: fontSizeSmall, color: rgb(0.5, 0.5, 0.5) });
    }

    // Estudios
    if (data.motivo_clinico && (!data.estudios || !data.estudios.some(e => e.motivo_clinico))) {
        drawDual(`Motivo General: ${data.motivo_clinico}`, xEstudios, yEstudios, { maxWidth: 110, lineHeight: 3, size: fontSizeSmall, font: fontBold });
        yEstudios -= 4;
    }

    if (data.estudios && data.estudios.length > 0) {
        data.estudios.forEach((estudio) => {
            const nombreEstudio = estudio.nombre_estudio.length > 50
                ? estudio.nombre_estudio.substring(0, 50) + '...'
                : estudio.nombre_estudio;

            drawDual(`- ${nombreEstudio}`, xEstudios, yEstudios, { size: fontSizeSmall, font: fontBold });
            yEstudios -= 3;

            if (estudio.motivo_clinico) {
                drawDual(`  Motivo: ${estudio.motivo_clinico}`, xEstudios + 5, yEstudios, { maxWidth: 105, lineHeight: 2.5, size: 1.5, color: rgb(0.3, 0.3, 0.3) });
                yEstudios -= 3.5;
            } else {
                yEstudios -= 1;
            }
        });
    } else {
        drawDual("Sin estudios registrados", xEstudios, yEstudios, { size: fontSizeSmall });
    }

    // --- FIRMAS (Symmetrical Layout) ---
    // Width approx 140. Center ~70.
    // Let's use 35 (Left) and 105 (Right).

    const yFirmaImage = 35;
    const yNombre = 30;
    const yLabel = 28;

    const xLeft = 35; // Solicitó
    const xRight = 105; // Autorizó

    // 1. MÉDICO SOLICITANTE (Left)
    if (data.medico_firma) {
        await drawSignatureCentered(data.medico_firma, xLeft, yFirmaImage);
    }
    drawCenteredDual(data.medico_solicitante || '', xLeft, yNombre, { size: 2.5, font: fontBold });
    drawCenteredDual("Solicitó", xLeft, yLabel, { size: 2, color: rgb(0.4, 0.4, 0.4) });

    // 2. COORDINADOR AUTORIZÓ (Right)
    if (data.coordinador_firma) {
        await drawSignatureCentered(data.coordinador_firma, xRight, yFirmaImage);
    }
    drawCenteredDual(data.coordinador_nombre || '', xRight, yNombre, { size: 2.5, font: fontBold });
    drawCenteredDual("Autorizó", xRight, yLabel, { size: 2, color: rgb(0.4, 0.4, 0.4) });

    // 3. ELABORÓ (Bottom Center)
    const yElaboro = 15; // Raised from 5
    const xCenter = 70;

    // Draw line? Optional.
    // page.drawLine({ start: { x: xCenter - 20, y: yElaboro + 2 }, end: { x: xCenter + 20, y: yElaboro + 2 }, thickness: 0.1 });

    drawCenteredDual(`Elaboró: ${data.elaboro_nombre || '---'}`, xCenter, yElaboro, { size: 1.8, color: rgb(0.5, 0.5, 0.5) });

    // 4. Guardar PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
