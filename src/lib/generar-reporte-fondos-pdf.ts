// src/lib/generar-reporte-fondos-pdf.ts

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import type { MedicamentoAlerta, ResumenAlertas, EstadoAlerta } from '@/types/alertas-fondos';

// Colores por estado
const COLORES_ESTADO: Record<EstadoAlerta, { r: number; g: number; b: number }> = {
  CRITICO: { r: 0.86, g: 0.15, b: 0.15 },  // Rojo
  BAJO: { r: 0.80, g: 0.52, b: 0.10 },      // Naranja
  MEDIO: { r: 0.12, g: 0.46, b: 0.70 },     // Azul
  NORMAL: { r: 0.13, g: 0.55, b: 0.13 },    // Verde
};

// Configuracion de la pagina
const CONFIG = {
  margenIzq: 40,
  margenDer: 40,
  margenSup: 50,
  margenInf: 50,
  anchoColumnas: {
    numero: 30,
    medicamento: 180,
    existencia: 65,
    fondo: 65,
    faltante: 65,
    porcentaje: 55,
    estado: 70,
  },
  alturaFila: 18,
  tamanoFuente: 9,
  tamanoFuentePequena: 8,
  tamanoTitulo: 16,
  tamanoSubtitulo: 12,
};

// Interfaz para datos del reporte
interface DatosReporte {
  fechaGeneracion: string;
  resumen: ResumenAlertas;
  medicamentos: MedicamentoAlerta[];
}

// Formatear fecha
function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Truncar texto si es muy largo
function truncarTexto(texto: string, maxLargo: number): string {
  if (texto.length <= maxLargo) return texto;
  return texto.substring(0, maxLargo - 3) + '...';
}

// Dibujar encabezado de pagina
async function dibujarEncabezado(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  datos: DatosReporte,
  numeroPagina: number,
  totalPaginas: number
): Promise<number> {
  const { width, height } = page.getSize();
  let yPos = height - CONFIG.margenSup;

  // Titulo principal
  page.drawText('REPORTE DE ALERTAS DE INVENTARIO', {
    x: CONFIG.margenIzq,
    y: yPos,
    size: CONFIG.tamanoTitulo,
    font: fontBold,
    color: rgb(0.12, 0.25, 0.68),
  });

  yPos -= 20;

  // Subtitulo con fecha
  page.drawText(`Fecha de generacion: ${datos.fechaGeneracion}`, {
    x: CONFIG.margenIzq,
    y: yPos,
    size: CONFIG.tamanoFuentePequena,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Numero de pagina
  const textoPagina = `Pagina ${numeroPagina} de ${totalPaginas}`;
  const anchoPagina = font.widthOfTextAtSize(textoPagina, CONFIG.tamanoFuentePequena);
  page.drawText(textoPagina, {
    x: width - CONFIG.margenDer - anchoPagina,
    y: yPos,
    size: CONFIG.tamanoFuentePequena,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });

  yPos -= 15;

  // Linea separadora
  page.drawLine({
    start: { x: CONFIG.margenIzq, y: yPos },
    end: { x: width - CONFIG.margenDer, y: yPos },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  return yPos - 15;
}

// Dibujar resumen de alertas
function dibujarResumen(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  resumen: ResumenAlertas,
  yPos: number
): number {
  const anchoTarjeta = 100;
  const altoTarjeta = 45;
  const espacioEntre = 15;
  let xPos = CONFIG.margenIzq;

  // Titulo seccion
  page.drawText('Resumen de Alertas', {
    x: CONFIG.margenIzq,
    y: yPos,
    size: CONFIG.tamanoSubtitulo,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  yPos -= 25;

  // Tarjetas de resumen
  const tarjetas = [
    { titulo: 'CRITICOS', valor: resumen.criticos, color: COLORES_ESTADO.CRITICO },
    { titulo: 'BAJOS', valor: resumen.bajos, color: COLORES_ESTADO.BAJO },
    { titulo: 'MEDIOS', valor: resumen.medios, color: COLORES_ESTADO.MEDIO },
    { titulo: 'TOTAL', valor: resumen.total_alertas, color: { r: 0.3, g: 0.3, b: 0.3 } },
  ];

  for (const tarjeta of tarjetas) {
    // Fondo de tarjeta
    page.drawRectangle({
      x: xPos,
      y: yPos - altoTarjeta,
      width: anchoTarjeta,
      height: altoTarjeta,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: rgb(tarjeta.color.r, tarjeta.color.g, tarjeta.color.b),
      borderWidth: 2,
    });

    // Valor
    const textoValor = tarjeta.valor.toString();
    const anchoValor = fontBold.widthOfTextAtSize(textoValor, 18);
    page.drawText(textoValor, {
      x: xPos + (anchoTarjeta - anchoValor) / 2,
      y: yPos - 22,
      size: 18,
      font: fontBold,
      color: rgb(tarjeta.color.r, tarjeta.color.g, tarjeta.color.b),
    });

    // Titulo
    const anchoTitulo = font.widthOfTextAtSize(tarjeta.titulo, 8);
    page.drawText(tarjeta.titulo, {
      x: xPos + (anchoTarjeta - anchoTitulo) / 2,
      y: yPos - 38,
      size: 8,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    xPos += anchoTarjeta + espacioEntre;
  }

  return yPos - altoTarjeta - 25;
}

// Dibujar encabezado de tabla
function dibujarEncabezadoTabla(
  page: PDFPage,
  fontBold: PDFFont,
  yPos: number
): number {
  const { width } = page.getSize();
  const altoEncabezado = 22;

  // Fondo del encabezado
  page.drawRectangle({
    x: CONFIG.margenIzq,
    y: yPos - altoEncabezado,
    width: width - CONFIG.margenIzq - CONFIG.margenDer,
    height: altoEncabezado,
    color: rgb(0.12, 0.25, 0.68),
  });

  let xPos = CONFIG.margenIzq + 5;
  const yTexto = yPos - 15;

  // Columnas
  const columnas = [
    { texto: '#', ancho: CONFIG.anchoColumnas.numero },
    { texto: 'Medicamento', ancho: CONFIG.anchoColumnas.medicamento },
    { texto: 'Existencia', ancho: CONFIG.anchoColumnas.existencia },
    { texto: 'Fondo Fijo', ancho: CONFIG.anchoColumnas.fondo },
    { texto: 'Faltante', ancho: CONFIG.anchoColumnas.faltante },
    { texto: '%', ancho: CONFIG.anchoColumnas.porcentaje },
    { texto: 'Estado', ancho: CONFIG.anchoColumnas.estado },
  ];

  for (const col of columnas) {
    page.drawText(col.texto, {
      x: xPos,
      y: yTexto,
      size: CONFIG.tamanoFuentePequena,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    xPos += col.ancho;
  }

  return yPos - altoEncabezado;
}

// Dibujar fila de medicamento
function dibujarFilaMedicamento(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  medicamento: MedicamentoAlerta,
  indice: number,
  yPos: number
): number {
  const { width } = page.getSize();

  // Fondo alternado
  if (indice % 2 === 0) {
    page.drawRectangle({
      x: CONFIG.margenIzq,
      y: yPos - CONFIG.alturaFila,
      width: width - CONFIG.margenIzq - CONFIG.margenDer,
      height: CONFIG.alturaFila,
      color: rgb(0.97, 0.97, 0.97),
    });
  }

  let xPos = CONFIG.margenIzq + 5;
  const yTexto = yPos - 12;

  // Numero
  page.drawText((indice + 1).toString(), {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuentePequena,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  xPos += CONFIG.anchoColumnas.numero;

  // Nombre medicamento (truncado)
  const nombreTruncado = truncarTexto(medicamento.nombre_comercial, 30);
  page.drawText(nombreTruncado, {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuente,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });
  xPos += CONFIG.anchoColumnas.medicamento;

  // Existencia
  page.drawText(medicamento.existencia_actual.toString(), {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuente,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });
  xPos += CONFIG.anchoColumnas.existencia;

  // Fondo fijo
  page.drawText(medicamento.fondo_fijo.toString(), {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuente,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });
  xPos += CONFIG.anchoColumnas.fondo;

  // Faltante
  page.drawText(medicamento.faltante.toString(), {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuente,
    font: fontBold,
    color: rgb(0.8, 0.2, 0.2),
  });
  xPos += CONFIG.anchoColumnas.faltante;

  // Porcentaje
  page.drawText(`${medicamento.porcentaje}%`, {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuente,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });
  xPos += CONFIG.anchoColumnas.porcentaje;

  // Estado con color
  const colorEstado = COLORES_ESTADO[medicamento.estado];
  page.drawText(medicamento.estado, {
    x: xPos,
    y: yTexto,
    size: CONFIG.tamanoFuente,
    font: fontBold,
    color: rgb(colorEstado.r, colorEstado.g, colorEstado.b),
  });

  return yPos - CONFIG.alturaFila;
}

// Dibujar pie de pagina
function dibujarPiePagina(page: PDFPage, font: PDFFont): void {
  const { width } = page.getSize();
  const yPos = CONFIG.margenInf - 20;

  // Linea separadora
  page.drawLine({
    start: { x: CONFIG.margenIzq, y: yPos + 10 },
    end: { x: width - CONFIG.margenDer, y: yPos + 10 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Texto del pie
  const textoPie = 'Servicio Medico - Sistema de Gestion de Inventario';
  const anchoPie = font.widthOfTextAtSize(textoPie, 8);
  page.drawText(textoPie, {
    x: (width - anchoPie) / 2,
    y: yPos,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
}

// Generar PDF de reporte de alertas
export async function generarReporteFondosPDF(
  medicamentos: MedicamentoAlerta[],
  resumen: ResumenAlertas
): Promise<Uint8Array> {
  // Crear documento
  const pdfDoc = await PDFDocument.create();

  // Cargar fuentes
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Datos del reporte
  const datos: DatosReporte = {
    fechaGeneracion: formatearFecha(new Date()),
    resumen,
    medicamentos,
  };

  // Calcular numero de paginas
  const medicamentosPorPagina = 25;
  const totalPaginas = Math.max(1, Math.ceil(medicamentos.length / medicamentosPorPagina));

  // Generar paginas
  for (let pag = 0; pag < totalPaginas; pag++) {
    const page = pdfDoc.addPage([612, 792]); // Carta
    const { height } = page.getSize();

    let yPos = await dibujarEncabezado(page, font, fontBold, datos, pag + 1, totalPaginas);

    // Solo mostrar resumen en la primera pagina
    if (pag === 0) {
      yPos = dibujarResumen(page, font, fontBold, resumen, yPos);
    }

    // Titulo de la tabla
    page.drawText('Detalle de Medicamentos con Alerta', {
      x: CONFIG.margenIzq,
      y: yPos,
      size: CONFIG.tamanoSubtitulo,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 20;

    // Encabezado de tabla
    yPos = dibujarEncabezadoTabla(page, fontBold, yPos);

    // Medicamentos de esta pagina
    const inicioMed = pag * medicamentosPorPagina;
    const finMed = Math.min(inicioMed + medicamentosPorPagina, medicamentos.length);

    for (let i = inicioMed; i < finMed; i++) {
      yPos = dibujarFilaMedicamento(page, font, fontBold, medicamentos[i], i, yPos);

      // Verificar si necesitamos saltar de pagina
      if (yPos < CONFIG.margenInf + 30 && i < finMed - 1) {
        break;
      }
    }

    // Pie de pagina
    dibujarPiePagina(page, font);
  }

  // Guardar PDF
  return await pdfDoc.save();
}
