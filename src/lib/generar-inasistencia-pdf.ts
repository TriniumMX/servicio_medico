// src/lib/generar-inasistencia-pdf.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ReferenciaEspecialidad } from '@/types/referencias';

interface DatosInasistencia {
  referencia: ReferenciaEspecialidad;
  motivo: string;
  fechaGenerado: string;     // ISO string
  nombreEmisor: string;
}

export async function generarInasistenciaPDF(datos: DatosInasistencia): Promise<Uint8Array> {
  const { referencia, motivo, fechaGenerado, nombreEmisor } = datos;

  // Crear documento tamaño carta (612 x 792 pts)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);

  // Fuentes
  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Colores
  const cNegro      = rgb(0.1,  0.1,  0.1);
  const cGris       = rgb(0.45, 0.45, 0.45);
  const cAzul       = rgb(0.05, 0.41, 0.62);
  const cRojo       = rgb(0.72, 0.18, 0.18);
  const cLinea      = rgb(0.75, 0.75, 0.75);
  const cFondo      = rgb(0.95, 0.97, 0.99);
  const cFondoRojo  = rgb(1,    0.96, 0.96);
  const cBlanco     = rgb(1,    1,    1);

  const { width, height } = page.getSize();
  const mX        = 50;
  const anchoUtil = width - mX * 2;
  const col1X     = mX + 10;
  const col2X     = mX + anchoUtil / 2 + 10;

  // ── Helpers ──────────────────────────────────────────────
  const draw = (text: string, x: number, y: number, size = 10, font = fontReg, color = cNegro) => {
    if (!text) return;
    page.drawText(text, { x, y, size, font, color });
  };

  const drawLine = (y: number, color = cLinea, thickness = 0.5) =>
    page.drawLine({ start: { x: mX, y }, end: { x: width - mX, y }, thickness, color });

  const drawRect = (x: number, y: number, w: number, h: number, color: typeof cFondo) =>
    page.drawRectangle({ x, y, width: w, height: h, color });

  const drawWrapped = (
    text: string, x: number, startY: number, maxW: number,
    lineH: number, size = 10, font = fontReg, color = cNegro,
  ): number => {
    if (!text) return startY;
    let y = startY;
    for (const parrafo of text.split('\n')) {
      let linea = '';
      for (const palabra of parrafo.split(' ')) {
        const prueba = linea + palabra + ' ';
        if (font.widthOfTextAtSize(prueba, size) > maxW && linea.length > 0) {
          draw(linea.trim(), x, y, size, font, color);
          linea = palabra + ' ';
          y -= lineH;
        } else {
          linea = prueba;
        }
      }
      if (linea.trim()) { draw(linea.trim(), x, y, size, font, color); y -= lineH; }
    }
    return y;
  };

  // ── Logo ─────────────────────────────────────────────────
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  try {
    const logoBytes = await fetch('/logo_pandora.png').then(r => r.arrayBuffer());
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch {
    // Si no carga el logo, continuar sin él
  }

  // ── ENCABEZADO ────────────────────────────────────────────
  let cursorY = height - 45;
  const headerH = 50;

  // Barra superior azul
  drawRect(mX, cursorY - headerH + 8, anchoUtil, headerH, cAzul);

  // Logo a la izquierda dentro de la barra
  const logoAreaX = mX + 10;
  const logoY     = cursorY - headerH + 14;
  const logoMaxH  = 32;
  const logoMaxW  = 90;

  if (logoImage) {
    const dims     = logoImage.scale(1);
    const scale    = Math.min(logoMaxW / dims.width, logoMaxH / dims.height);
    const lW       = dims.width  * scale;
    const lH       = dims.height * scale;
    page.drawImage(logoImage, { x: logoAreaX, y: logoY, width: lW, height: lH });
  }

  // Texto "Servicio Médico Pandora" junto al logo
  const textoInicioX = logoImage ? logoAreaX + logoMaxW + 6 : logoAreaX;
  draw('Servicio Médico Pandora', textoInicioX, cursorY - 15, 12, fontBold, cBlanco);
  draw('Gestión de Referencias a Especialidad', textoInicioX, cursorY - 29, 8, fontOblique, rgb(0.85, 0.93, 1));

  cursorY -= headerH + 6;

  // Título del documento
  cursorY -= 18;
  const titulo  = 'CONSTANCIA DE INASISTENCIA A CITA CON ESPECIALISTA';
  const tituloW = fontBold.widthOfTextAtSize(titulo, 13);
  draw(titulo, (width - tituloW) / 2, cursorY, 13, fontBold, cRojo);

  cursorY -= 6;
  drawLine(cursorY, cRojo, 1.2);

  // Folio y fecha de generación
  cursorY -= 16;
  const folio       = referencia.folio || `REF-${referencia.id_referencia}`;
  const fechaGen    = new Date(fechaGenerado);
  const fechaTexto  = fechaGen.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const horaTexto   = fechaGen.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fechaHoraStr = `Generado: ${fechaTexto}, ${horaTexto}`;

  draw(`Folio: ${folio}`, mX, cursorY, 8, fontReg, cGris);
  const fhW = fontReg.widthOfTextAtSize(fechaHoraStr, 8);
  draw(fechaHoraStr, width - mX - fhW, cursorY, 8, fontReg, cGris);

  cursorY -= 14;
  drawLine(cursorY);

  // ── DATOS DEL PACIENTE ────────────────────────────────────
  cursorY -= 16;
  draw('DATOS DEL PACIENTE', mX, cursorY, 10, fontBold, cAzul);
  cursorY -= 4;
  drawLine(cursorY, cAzul, 0.8);
  cursorY -= 12;

  const pacH = cursorY;
  drawRect(mX, pacH - 54, anchoUtil, 64, cFondo);

  draw('Nombre del paciente:',   col1X, pacH - 6,  8, fontBold, cGris);
  draw(referencia.nombre_paciente || '—', col1X, pacH - 18, 10, fontBold, cNegro);

  draw('Nómina:',                col2X, pacH - 6,  8, fontBold, cGris);
  draw(referencia.no_nomina || '—', col2X, pacH - 18, 10, fontBold, cNegro);

  draw('Departamento:',          col1X, pacH - 36, 8, fontBold, cGris);
  draw(referencia.departamento || 'No especificado', col1X, pacH - 48, 9, fontReg, cNegro);

  draw('Tipo:',                  col2X, pacH - 36, 8, fontBold, cGris);
  draw(referencia.id_beneficiario ? 'Beneficiario' : 'Empleado', col2X, pacH - 48, 9, fontReg, cNegro);

  cursorY = pacH - 68;

  // ── DATOS DE LA REFERENCIA ────────────────────────────────
  cursorY -= 14;
  draw('DATOS DE LA REFERENCIA', mX, cursorY, 10, fontBold, cAzul);
  cursorY -= 4;
  drawLine(cursorY, cAzul, 0.8);
  cursorY -= 12;

  const refH = cursorY;
  drawRect(mX, refH - 74, anchoUtil, 84, cFondo);

  draw('Especialidad:',          col1X, refH - 6,  8, fontBold, cGris);
  draw(referencia.nombre_especialidad || '—', col1X, refH - 18, 10, fontBold, cNegro);

  draw('Médico que refiere:',    col2X, refH - 6,  8, fontBold, cGris);
  draw(referencia.nombre_medico_refiere || '—', col2X, refH - 18, 9, fontReg, cNegro);

  const fechaCitaTexto = referencia.fecha_cita
    ? new Date(referencia.fecha_cita).toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : 'No establecida';
  draw('Fecha de cita programada:', col1X, refH - 36, 8, fontBold, cGris);
  draw(fechaCitaTexto,             col1X, refH - 48, 9, fontReg, cRojo);

  draw('Especialista asignado:',  col2X, refH - 36, 8, fontBold, cGris);
  draw(nombreEmisor,              col2X, refH - 48, 9, fontReg, cNegro);

  const motivoRef = (referencia.motivo_referencia || '—').slice(0, 80);
  draw('Motivo de referencia:',   col1X, refH - 62, 8, fontBold, cGris);
  draw(motivoRef,                 col1X, refH - 74, 9, fontReg, cNegro);

  cursorY = refH - 88;

  // ── MOTIVO DE INASISTENCIA ────────────────────────────────
  cursorY -= 14;
  draw('MOTIVO DE INASISTENCIA', mX, cursorY, 10, fontBold, cRojo);
  cursorY -= 4;
  drawLine(cursorY, cRojo, 0.8);

  // Espacio entre el título y el texto del motivo
  cursorY -= 18;

  // Medir cuántas líneas ocupa el motivo para dibujar el fondo correctamente
  const lineH      = 14;
  const motivoIniY = cursorY;
  const motivoFinY = drawWrapped(motivo, col1X, motivoIniY, anchoUtil - 20, lineH, 10, fontReg, cNegro);
  const cajaH      = Math.max(motivoIniY - motivoFinY + lineH + 20, 50);

  // Fondo rojo suave (dibujar ANTES del texto para que quede detrás)
  drawRect(mX, motivoFinY - 10, anchoUtil, cajaH, cFondoRojo);

  // Re-dibujar el texto encima del fondo
  drawWrapped(motivo, col1X, motivoIniY, anchoUtil - 20, lineH, 10, fontReg, cNegro);

  cursorY = motivoFinY - 22;

  // ── INFORMACIÓN DE EMISIÓN ────────────────────────────────
  cursorY -= 16;
  drawLine(cursorY, cLinea, 0.4);
  cursorY -= 16;

  draw('INFORMACIÓN DE EMISIÓN', mX, cursorY, 10, fontBold, cAzul);
  cursorY -= 4;
  drawLine(cursorY, cAzul, 0.8);
  cursorY -= 12;

  const emiH = cursorY;
  drawRect(mX, emiH - 46, anchoUtil, 56, cFondo);

  draw('Emitido por:',           col1X, emiH - 6,  8, fontBold, cGris);
  draw(nombreEmisor,             col1X, emiH - 18, 11, fontBold, cNegro);
  draw('Médico Especialista',    col1X, emiH - 30, 9, fontOblique, cGris);
  draw('Servicio Médico Pandora',col1X, emiH - 42, 8, fontOblique, cGris);

  const fechaCapital = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
  draw('Fecha y hora de emisión:', col2X, emiH - 6,  8, fontBold, cGris);
  draw(fechaCapital,               col2X, emiH - 18, 9, fontBold, cNegro);
  draw(`${horaTexto} hrs.`,        col2X, emiH - 30, 9, fontReg,  cGris);

  cursorY = emiH - 60;

  // ── FIRMA ────────────────────────────────────────────────
  cursorY -= 28;
  const firmaX = width / 2 - 70;
  page.drawLine({ start: { x: firmaX, y: cursorY }, end: { x: firmaX + 140, y: cursorY }, thickness: 0.8, color: cNegro });

  cursorY -= 13;
  const firmaW = fontBold.widthOfTextAtSize(nombreEmisor, 9);
  draw(nombreEmisor, (width - firmaW) / 2, cursorY, 9, fontBold, cNegro);
  cursorY -= 12;
  const cargoW = fontOblique.widthOfTextAtSize('Médico Especialista', 8);
  draw('Médico Especialista', (width - cargoW) / 2, cursorY, 8, fontOblique, cGris);

  // ── PIE DE PÁGINA ────────────────────────────────────────
  const pieY   = 28;
  drawLine(pieY + 10, cLinea, 0.4);
  const pie    = `Servicio Médico Pandora · Folio ${folio} · ${new Date(fechaGenerado).toLocaleDateString('es-MX')}`;
  const pieW   = fontOblique.widthOfTextAtSize(pie, 7);
  page.drawText(pie, { x: (width - pieW) / 2, y: pieY, size: 7, font: fontOblique, color: cGris });

  return await pdfDoc.save();
}
