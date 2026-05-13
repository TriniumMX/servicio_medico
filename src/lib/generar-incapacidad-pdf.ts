import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface IncapacidadData {
    id_incapacidad: number;
    folio_consulta: string;
    no_nomina: string;
    nombre_paciente: string;
    departamento: string;
    diagnostico: string; // CIE + Descripción
    dias_autorizados: number;
    fecha_inicio: string;
    fecha_fin: string;
    nombre_doctor: string;
    fecha_autorizacion: string;
    nombre_autorizador?: string;
}

export async function generarIncapacidadPDF(data: IncapacidadData) {
    console.log('=== DATA RECIBIDA PARA PDF ===', {
        id: data.id_incapacidad,
        autorizador: data.nombre_autorizador,
        todo: data
    });

    // 1. Cargar el template
    const formUrl = '/formato_Incapacidad.pdf';
    const formPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(formPdfBytes);

    // 2. Preparar fuente
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.getPages()[0];
    const { height } = page.getSize();

    // 3. Definir función para dibujar en una sección dada un offset Y
    // El PDF tiene 3 secciones verticales idénticas. Definimos el offset de cada una.
    // Asumimos que el PDF coord (0,0) es abajo-izquierda.
    // Los ajustes Y son NEGATIVOS si medimos desde arriba, o ajustamos el punto base.

    // COORDENADAS BASE (Ajustadas para la PRIMERA sección - SUPERIOR)
    // Nota: Estas coordenadas son ESTIMADAS y requieren calibración visual.
    // Se usará un 'baseY' para cada una de las 3 copias.

    // Altura aproximada de cada sección (1/3 de página carta ~ 260 puntos)
    // Section 1 (Top): Y ~ 550 - 750
    // Section 2 (Mid): Y ~ 280 - 480
    // Section 3 (Bot): Y ~ 20 - 220

    // 3. CONFIGURACIÓN DE COORDENADAS (X, Y)
    // Ajusta estos valores para mover los textos.
    // (0,0) es la esquina inferior izquierda del PDF.
    const COORDS = {
        // Esquina Superior Derecha
        consulta: { x: 400, y: 741 },
        folioIncapacidad: { x: 383, y: 724 },
        nomina: { x: 398, y: 707 },

        // Datos del Trabajador
        nombrePaciente: { x: 90, y: 669 },
        departamento: { x: 95, y: 651 },

        // Periodo
        periodoFechas: { x: 93, y: 597.5 },
        doctor: { x: 150, y: 581 },
        diagnostico: { x: 110, y: 565 },

        // Firma / Autorizador (abajo izquierda)
        autorizador: { x: 60, y: 510 },
    };

    // offsetsY para desplazar el contenido hacia abajo para cada copia
    // 0 -> Primera copia (Arriba)
    // -280 -> Segunda copia (Medio) (Ajustado para bajar el contenido)
    // -560 -> Tercera copia (Abajo) (Ajustado para bajar el contenido)
    const offsetsY = [0, -260, -520];

    const drawText = (text: string, x: number, y: number, size: number = 8, isBold: boolean = false) => {
        if (!text) return;
        page.drawText(String(text), {
            x,
            y,
            font: isBold ? fontBold : font,
            size,
            color: rgb(0, 0, 0),
        });
    };

    offsetsY.forEach((offset) => {
        // Coordenadas relativas a la sección superior

        // 1. Cabecera (Derecha)
        // Consulta
        drawText(data.folio_consulta || '', COORDS.consulta.x, COORDS.consulta.y + offset, 9);
        // Folio Incapacidad
        drawText(data.id_incapacidad.toString(), COORDS.folioIncapacidad.x, COORDS.folioIncapacidad.y + offset, 9, true);
        // Nómina
        drawText(data.no_nomina || '', COORDS.nomina.x, COORDS.nomina.y + offset, 9);

        // 2. Datos del Trabajador
        // Nombre
        drawText(data.nombre_paciente || '', COORDS.nombrePaciente.x, COORDS.nombrePaciente.y + offset, 9, true);
        // Secretaría / Departamento
        drawText(data.departamento || '', COORDS.departamento.x, COORDS.departamento.y + offset, 8);

        // 3. Periodo de Duración
        // Periodo (Fechas)
        const periodo = `Del ${new Date(data.fecha_inicio).toLocaleDateString()} al ${new Date(data.fecha_fin).toLocaleDateString()} (${data.dias_autorizados} Días)`;
        drawText(periodo, COORDS.periodoFechas.x, COORDS.periodoFechas.y + offset, 9, true);

        // Doctor que incapacitó
        drawText(data.nombre_doctor || 'N/A', COORDS.doctor.x, COORDS.doctor.y + offset, 8);

        // Diagnóstico
        // Puede ser largo, así que tal vez necesite ajuste o recorte
        const dxTexto = data.diagnostico.length > 70 ? data.diagnostico.substring(0, 70) + '...' : data.diagnostico;
        drawText(dxTexto, COORDS.diagnostico.x, COORDS.diagnostico.y + offset, 8);

        // Autorizador (abajo izquierda)
        // La etiqueta "Autorizó:" ya viene en la plantilla
        if (data.nombre_autorizador) {
            drawText(data.nombre_autorizador, COORDS.autorizador.x - 15, COORDS.autorizador.y + offset + 39, 8, true);
        }
    });

    // 4. Guardar PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
