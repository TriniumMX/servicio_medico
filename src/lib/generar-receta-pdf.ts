// src/lib/generar-receta-pdf.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import * as bwipjs from 'bwip-js';
import QRCode from 'qrcode';

// Coordenadas para campos de incapacidad y especialidad
const COORDENADAS_EXTRAS = {
  incapacidad: { x: 300, y: 138 },
  incapacidad_inicio: { x: 444, y: 152 },
  incapacidad_fin: { x: 423, y: 126 },
  especialidad: { x: 875, y: 140 },
};

// ============================================
// CONFIGURACIÓN DE MEDICAMENTOS - AJUSTAR AQUÍ
// ============================================
const CONFIG_MEDICAMENTOS = {
  // Posición Y inicial (primer medicamento)
  inicio_y: 310,

  // Espacio vertical entre cada medicamento
  espacio_entre_lineas: 16, // Ligeramente reducido para simetría

  // Límite inferior Y (para saber cuándo crear nueva página)
  limite_inferior_y: 80,  // ← BAJADO de 200 a 80 = MÁS medicamentos por página

  // Posiciones X de cada columna (Ajustadas para simetría horizontal y optimizar espacio)
  columnas: {
    nombre: 40,           // Columna 1: Nombre del medicamento
    indicaciones: 215,    // Columna 2: Indicaciones/Dosis
    tratamiento: 485,     // Columna 3: Duración del tratamiento
    piezas: 550,          // Columna 4: Cantidad de piezas
  },

  // Ancho máximo de las columnas (para salto de línea)
  anchos: {
    nombre: 165,          // Ancho máximo para nombre
    indicaciones: 260,    // Ancho máximo para indicaciones
    tratamiento: 60,      // Ancho máximo para tratamiento
  },

  // Tamaño de fuente
  tamano_fuente: 8,
  tamano_fuente_indicaciones: 7,  // Fuente más pequeña para indicaciones
};

// Calcular cuántos medicamentos caben por página
const MAX_MEDICAMENTOS_POR_PAGINA = Math.floor(
  (CONFIG_MEDICAMENTOS.inicio_y - CONFIG_MEDICAMENTOS.limite_inferior_y) / CONFIG_MEDICAMENTOS.espacio_entre_lineas
);

/**
 * Genera un código de barras CODE128 a partir de un texto
 * @param texto Texto a codificar (ejemplo: "2238-L9EYXFPC")
 * @returns Buffer de la imagen PNG del código de barras
 */
async function generarCodigoBarras(texto: string): Promise<Buffer> {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',       // Tipo de código de barras
      text: texto,           // Texto a codificar
      scale: 2,              // ⚙️ Factor de escala (grosor de barras) - REDUCIDO de 3 a 2 = más delgado
      height: 8,             // ⚙️ Altura en mm - REDUCIDO de 10 a 8 = más bajo
      includetext: true,     // Mostrar texto debajo del código
      textxalign: 'center',  // Alineación del texto
      textsize: 10,          // Tamaño del texto debajo del código
    });
    return png;
  } catch (error) {
    console.error('Error al generar código de barras:', error);
    throw error;
  }
}

/**
 * Genera un código QR a partir de una URL
 * @param url URL a codificar en el QR
 * @returns Buffer de la imagen PNG del código QR
 */
async function generarCodigoQR(url: string): Promise<Buffer> {
  try {
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'M',
      type: 'png',
      margin: 1,
      width: 150, // Tamaño del QR
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrBuffer;
  } catch (error) {
    console.error('Error al generar código QR:', error);
    throw error;
  }
}

/**
 * Función auxiliar para envolver texto largo en múltiples líneas
 * Maneja correctamente los saltos de línea \n para evitar errores de codificación WinAnsi
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  // Primero dividir por saltos de línea para procesarlos correctamente
  const paragraphs = text.split(/\r?\n/);
  const allLines: string[] = [];

  // Procesar cada párrafo individualmente
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      // Si es una línea vacía, agregarla como tal
      allLines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) allLines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) allLines.push(currentLine);
  }

  return allLines;
}

/**
 * Dibuja toda la información estática de la consulta en una página
 * (Datos de consulta, paciente, signos vitales, diagnóstico, médico, código de barras)
 * Esta función se usa en TODAS las páginas para mantener consistencia
 */
async function dibujarInformacionEstatica(
  page: any,
  datos: any,
  font: any,
  fontBold: any,
  fontSize: number,
  fontSizeSmall: number,
  pdfDoc: PDFDocument
): Promise<void> {
  const lineHeight = 25;

  // ====== MARCA DE TIPO DE RECETA Y MEDICAMENTO CONTROLADO ======
  if (datos.tipoReceta === 'farmacia') {
    page.drawText('PARA FARMACIA', {
      x: 410, y: 769, size: 7, font: fontBold, color: rgb(0.2, 0.2, 0.2),
    });

    // Si es una hoja exclusiva de medicamento controlado, agregar la leyenda
    if (datos.es_hoja_controlado) {
      page.drawText('RECETA POR MEDICAMENTO CONTROLADO', {
        x: 100, y: 769, // Posición superior, alineada con la otra leyenda pero a la izquierda
        size: 8,
        font: fontBold,
        color: rgb(0.8, 0.2, 0.2), // Rojo notable pero no chillón
      });
    }
  } else if (datos.tipoReceta === 'paciente') {
    page.drawText('COPIA PARA EL PACIENTE', {
      x: 410, y: 769, size: 7, font: fontBold, color: rgb(0, 0.4, 0.7), // Azul
    });
  } else if (datos.tipoReceta === 'archivo') {
    page.drawText('COPIA PARA ARCHIVO', {
      x: 410, y: 769, size: 7, font: fontBold, color: rgb(0.4, 0.4, 0.4), // Gris oscuro
    });
  }

  // ====== DATOS DE LA CONSULTA ======
  page.drawText(datos.consulta || '', {
    x: 88, y: 672, size: 12, font: fontBold, color: rgb(0, 0, 0),
  });

  page.drawText(datos.nomina || '', {
    x: 308, y: 695 - lineHeight, size: 11, font: fontBold, color: rgb(0, 0, 0),
  });

  page.drawText(datos.folio_consulta || '', {
    x: 125, y: 702 - (lineHeight * 2), size: 10.5, font: fontBold, color: rgb(0, 0, 0),
  });

  page.drawText(datos.sindicato || '', {
    x: 312, y: 726 - (lineHeight * 3), size: 10, font: fontBold, color: rgb(0, 0, 0),
  });

  page.drawText(datos.fecha_nac || '', {
    x: 100, y: 732 - (lineHeight * 4), size: 12, font: fontBold, color: rgb(0, 0, 0),
  });

  // Secretaría con salto de línea
  if (datos.secretaria) {
    const MAX_WIDTH_SECRETARIA = 180;
    const secretariaLines = wrapText(datos.secretaria, MAX_WIDTH_SECRETARIA, font, 8);
    secretariaLines.forEach((line, index) => {
      page.drawText(line, {
        x: 317, y: (757 - (lineHeight * 5)) - (index * 10), size: 8, font: fontBold, color: rgb(0, 0, 0),
      });
    });
  }

  // Parentesco - Debajo de Secretaría (alineado con la etiqueta)
  if (datos.parentesco) {
    page.drawText(`PARENTESCO: ${datos.parentesco}`, {
      x: 262, y: 605, size: 8, font: fontBold, color: rgb(0, 0, 0),
    });
  }

  // ====== DATOS DEL PACIENTE ======
  page.drawText(datos.nombre_paciente || '', {
    x: 117, y: 575, size: 10, font: fontBold, color: rgb(0, 0, 0),
  });

  page.drawText(datos.edad || '', {
    x: 435, y: 575, size: 10, font: fontBold, color: rgb(0, 0, 0),
  });

  // ====== SIGNOS VITALES ======
  page.drawText(datos.ta_sistolica || '', {
    x: 36, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.ta_diastolica || '', {
    x: 56, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.temperatura || '', {
    x: 115, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.fc || '', {
    x: 210, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.oxigenacion || '', {
    x: 295, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.altura || '', {
    x: 370, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.peso || '', {
    x: 450, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });
  page.drawText(datos.glucosa || '', {
    x: 540, y: 535, size: 9, font: fontBold, color: rgb(0, 0, 0),
  });

  // ====== DIAGNÓSTICO ======
  let currentY = 480; // Posición Y inicial para la sección de diagnóstico
  const lineSpacing = 12; // Espacio entre líneas
  const sectionSpacing = 15; // Espacio entre objetivo y diagnóstico CIE11

  // Dibujar objetivo (hallazgos objetivos)
  if (datos.objetivo) {
    const objetivoLines = wrapText(datos.objetivo, 500, font, fontSizeSmall);
    objetivoLines.forEach((line, index) => {
      page.drawText(line, {
        x: 70,
        y: currentY - (index * lineSpacing),
        size: fontSizeSmall,
        font: font,
        color: rgb(0, 0, 0),
      });
    });
    // Actualizar currentY para el siguiente elemento (bajar según líneas usadas + espacio extra)
    currentY = currentY - (objetivoLines.length * lineSpacing) - sectionSpacing;
  }

  // Dibujar diagnósticos CIE11 (puede ser múltiples)
  // Primero intentar usar el array de diagnósticos, si no existe usar el campo simple
  const diagnosticosArray = datos.diagnosticos || [];

  if (diagnosticosArray.length > 0) {
    // Mostrar múltiples diagnósticos
    for (let i = 0; i < diagnosticosArray.length; i++) {
      const diag = diagnosticosArray[i];
      let textoDiagnostico = '';

      if (diag.codigo && diag.titulo) {
        textoDiagnostico = `${diag.codigo} - ${diag.titulo}`;
      } else if (diag.codigo) {
        textoDiagnostico = diag.codigo;
      } else if (diag.titulo) {
        textoDiagnostico = diag.titulo;
      }

      // Agregar indicador de principal (usando caracteres ASCII compatibles con WinAnsi)
      if (diag.es_principal && diagnosticosArray.length > 1) {
        textoDiagnostico = `[P] ${textoDiagnostico}`;
      } else if (diagnosticosArray.length > 1) {
        textoDiagnostico = `[-] ${textoDiagnostico}`;
      }

      const diagnosticoLines = wrapText(textoDiagnostico, 500, font, fontSizeSmall);
      diagnosticoLines.forEach((line, index) => {
        page.drawText(line, {
          x: 70,
          y: currentY - (index * lineSpacing),
          size: fontSizeSmall,
          font: diag.es_principal ? fontBold : font, // Principal en negrita
          color: rgb(0, 0, 0),
        });
      });

      // Bajar para el siguiente diagnóstico
      currentY = currentY - (diagnosticoLines.length * lineSpacing) - 5;
    }
  } else if (datos.cie11_titulo || datos.cie11_codigo) {
    // Fallback: usar campos simples si no hay array
    let textoDiagnostico = '';
    if (datos.cie11_codigo && datos.cie11_titulo) {
      textoDiagnostico = `${datos.cie11_codigo} - ${datos.cie11_titulo}`;
    } else if (datos.cie11_codigo) {
      textoDiagnostico = datos.cie11_codigo;
    } else if (datos.cie11_titulo) {
      textoDiagnostico = datos.cie11_titulo;
    }

    const diagnosticoLines = wrapText(textoDiagnostico, 500, font, fontSizeSmall);
    diagnosticoLines.forEach((line, index) => {
      page.drawText(line, {
        x: 70,
        y: currentY - (index * lineSpacing),
        size: fontSizeSmall,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    });
  }

  // ====== TRIAGE (si hay referencia a especialista) ======
  if (datos.nivel_triage) {
    const triageInfo = [
      { nivel: 1, nombre: 'EMERGENCIA',   tiempo: '< 24 horas',  color: rgb(0.78, 0.10, 0.10) },
      { nivel: 2, nombre: 'URGENTE',      tiempo: '24-72 horas', color: rgb(0.85, 0.38, 0.00) },
      { nivel: 3, nombre: 'SEMI-URGENTE', tiempo: '1-2 semanas', color: rgb(0.72, 0.58, 0.00) },
      { nivel: 4, nombre: 'PROGRAMABLE',  tiempo: '2-4 semanas', color: rgb(0.10, 0.52, 0.10) },
      { nivel: 5, nombre: 'ELECTIVA',     tiempo: '1-3 meses',   color: rgb(0.10, 0.28, 0.70) },
    ][datos.nivel_triage - 1];

    if (triageInfo) {
      currentY -= 8;
      const label  = `TRIAGE`;
      const detail = `  ${triageInfo.nivel}  ${triageInfo.nombre}  |  ${triageInfo.tiempo}`;
      const fullText = label + detail;
      const badgeWidth = fontBold.widthOfTextAtSize(fullText, 7.5) + 14;

      // Fondo del badge de color
      page.drawRectangle({
        x: 68,
        y: currentY - 5,
        width: badgeWidth,
        height: 14,
        color: triageInfo.color,
      });

      // Texto en blanco
      page.drawText(fullText, {
        x: 75,
        y: currentY,
        size: 7.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    }
  }

  // ====== NOMBRE DEL MÉDICO Y PACIENTE (FIRMA) ======
  if (datos.nombre_medico) {
    page.drawText(datos.nombre_medico, {
      x: 88, y: 30, size: 8, font: fontBold, color: rgb(0, 0, 0),
    });

    if (datos.cedula_medico) {
      // Calcular ancho del nombre para posicionar la cédula
      const widthNombre = fontBold.widthOfTextAtSize(datos.nombre_medico, 8);
      const xCedula = 88 + widthNombre + 10; // 10px de margen

      page.drawText(`${datos.cedula_medico}`, {
        x: xCedula, y: 30, size: 7, font: font, color: rgb(0.3, 0.3, 0.3), // Un poco más pequeño y gris
      });
    }
  }

  // ====== ESPECIALIDAD REQUERIDA (REFERENCIA) ======
  // 🔧 AJUSTA ESTAS COORDENADAS según necesites:
  const especialidadX = 438;  // ← Coordenada X inicial
  const especialidadY = 84;   // ← Coordenada Y
  const especialidadSize = 8; // ← Tamaño de letra

  if (datos.especialidad) {
    // "REFERENCIA A:" en gris
    page.drawText('REFERENCIA A:', {
      x: especialidadX,
      y: especialidadY,
      size: especialidadSize - 1, // Un poco más pequeño
      font: fontBold,
      color: rgb(0.5, 0.5, 0.5) // Gris
    });

    // Especialidad en rojo (misma línea, después de la etiqueta)
    const anchoEtiqueta = fontBold.widthOfTextAtSize('REFERENCIA A: ', especialidadSize - 1);
    page.drawText(datos.especialidad, {
      x: especialidadX + anchoEtiqueta,
      y: especialidadY,
      size: especialidadSize,
      font: fontBold,
      color: rgb(0.7, 0.2, 0.2) // Rojo oscuro
    });
  }

  if (datos.nombre_paciente) {
    page.drawText(datos.nombre_paciente, {
      x: 420, y: 30, size: 8, font: fontBold, color: rgb(0, 0, 0),
    });
  }

  // ====== CÓDIGO DE BARRAS ======
  // Formato: NOMINA-ID_RECETA (Ejemplo: 2238-00000123)
  if (datos.nomina && datos.id_receta) {
    try {
      const idRecetaFormateado = datos.id_receta.toString().padStart(8, '0');
      const textoCodigoBarras = `${datos.nomina}-${idRecetaFormateado}`;
      const tieneMedicamentos = datos.medicamentos && datos.medicamentos.length > 0;

      // ====== PARA FARMACIA: Código de barras completo (imagen + texto) ======
      if (datos.tipoReceta === 'farmacia') {
        console.log('📊 Generando código de barras para FARMACIA:', textoCodigoBarras);

        const codigoBarrasPNG = await generarCodigoBarras(textoCodigoBarras);
        const codigoBarrasImage = await pdfDoc.embedPng(codigoBarrasPNG);
        const codigoBarrasDims = codigoBarrasImage.scale(0.35);

        page.drawImage(codigoBarrasImage, {
          x: 300,
          y: 735,
          width: codigoBarrasDims.width * 1.8,
          height: codigoBarrasDims.height,
        });

        console.log('✅ Código de barras (imagen) generado para FARMACIA');


        // ⬜ Cubrir el recuadro del QR (que viene en la plantilla) con un rectángulo blanco
        // Solo para farmacia, ya que ahí no va QR
        page.drawRectangle({
          x: 485,
          y: 596,
          width: 120, // Menos ancho para no salirse
          height: 94, // Menos alto para no cubrir líneas superior/inferior
          color: rgb(1, 1, 1), // Blanco
        });
      }
      // ====== PARA PACIENTE/ARCHIVO: Solo texto (sin imagen) - SOLO SI HAY MEDICAMENTOS ======
      else if ((datos.tipoReceta === 'paciente' || datos.tipoReceta === 'archivo') && tieneMedicamentos) {
        console.log('📝 Generando solo texto para PACIENTE:', textoCodigoBarras);

        page.drawText(textoCodigoBarras, {
          x: 350,
          y: 740,
          size: 10,
          font: fontBold,
          color: rgb(0, 0, 0),
        });

        console.log('✅ Texto de identificación generado para PACIENTE');
      }
      // ====== PARA PACIENTE/ARCHIVO SIN MEDICAMENTOS: No mostrar nada ======
      else if ((datos.tipoReceta === 'paciente' || datos.tipoReceta === 'archivo') && !tieneMedicamentos) {
        console.log('ℹ️ Copia del paciente sin medicamentos - No se genera código ni texto');
      }
    } catch (error) {
      console.error('❌ Error al generar código/texto:', error);
    }
  }

  // ====== CÓDIGO QR PARA ACCESO PÚBLICO ======
  // Se genera en la copia para el PACIENTE y muestra info completa de la receta
  console.log('🔍 [QR DEBUG] qrUrl:', datos.qrUrl);
  console.log('🔍 [QR DEBUG] tipoReceta:', datos.tipoReceta);

  if (datos.qrUrl && (datos.tipoReceta === 'paciente' || datos.tipoReceta === 'archivo')) {
    try {
      console.log('📱 Generando código QR para acceso público:', datos.qrUrl);

      const qrPNG = await generarCodigoQR(datos.qrUrl);
      const qrImage = await pdfDoc.embedPng(qrPNG);
      const qrDims = qrImage.scale(0.5); // Escala del QR

      // Posición del QR: esquina superior derecha (dentro del recuadro de la plantilla)
      const qrX = 506.5; // Ajustado para centrar en el recuadro
      const qrY = 605; // Ajustado a la altura de los datos del paciente

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrDims.width,
        height: qrDims.height,
      });


      console.log('✅ Código QR generado para acceso público');
    } catch (error) {
      console.error('❌ Error al generar código QR:', error);
    }
  }
}

interface DatosConsulta {
  // Datos de la consulta
  consulta?: string; // Fecha de consulta
  folio_consulta?: string;
  id_receta?: number | null; // ID de la receta para código de barras
  fecha_nac?: string;
  nomina?: string;
  sindicato?: string;
  secretaria?: string;
  parentesco?: string; // Nuevo campo

  // Datos del paciente
  nombre_paciente?: string;
  edad?: string;
  ta_sistolica?: string; // Presión sistólica (ej: "120")
  ta_diastolica?: string; // Presión diastólica (ej: "80")
  temperatura?: string;
  fc?: string; // Frecuencia cardíaca
  oxigenacion?: string;
  altura?: string;
  peso?: string;
  glucosa?: string;

  // SOAP - Diagnóstico
  objetivo?: string; // O de SOAP - Hallazgos objetivos
  cie11_codigo?: string; // Código CIE11 (campo simple, fallback)
  cie11_titulo?: string; // A de SOAP - Assessment (diagnóstico CIE11, fallback)

  // Array de múltiples diagnósticos (nuevo)
  diagnosticos?: {
    codigo: string;
    titulo: string;
    es_principal: boolean;
  }[];

  // Nivel de triage de la referencia a especialista (1-5)
  nivel_triage?: number;

  // Medicamentos (array)
  medicamentos?: {
    nombre: string;
    indicaciones: string;
    tratamiento: string; // Duración (ej: "7 días")
    piezas: string | number;
    realizar_resurtimiento?: boolean; // Si requiere resurtimiento
    meses_resurtimiento?: number; // Cada cuántos meses
    clasificacion?: string; // PATENTE, GENERICO, CONTROLADO
  }[];

  // Extras
  incapacidad?: string;
  incapacidad_inicio?: string;
  incapacidad_fin?: string;
  especialidad?: string;
  nombre_medico?: string;
  cedula_medico?: string; // Cédula profesional
  firma_medico?: string; // Texto o ruta a imagen de firma

  // Tipo de receta
  tipoReceta?: 'farmacia' | 'paciente' | 'archivo'; // Para diferenciar hojas de farmacia vs paciente vs archivo

  // URL del QR para acceso público
  qrUrl?: string; // URL pública para visualizar la receta

  // Flag para indicar receta sin medicamentos
  sinMedicamentos?: boolean; // Si es true, mostrar "***SIN MEDICAMENTOS***"

  // Flag para hojas exclusivas de medicamentos controlados
  es_hoja_controlado?: boolean;
}

/**
 * Genera un PDF de receta médica con los datos proporcionados
 * @param datos Datos de la consulta y receta
 * @returns Buffer del PDF generado
 */
export async function generarRecetaPDF(datos: DatosConsulta): Promise<Uint8Array> {
  // Cargar el PDF template
  const templatePath = path.join(process.cwd(), 'public', 'Receta-general.pdf');
  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);

  // Cargar template limpio SEPARADO para copiar páginas adicionales
  const templateLimpio = await PDFDocument.load(templateBytes);

  // Obtener primera página
  let pages = pdfDoc.getPages();
  let currentPage = pages[0];
  let pageHeight = currentPage.getHeight();

  // Cargar fuente
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  const fontSizeSmall = 8;

  // Función auxiliar para dibujar texto usando coordenadas predefinidas
  const drawText = (
    page: any,
    text: string,
    coordKey: keyof typeof COORDENADAS_EXTRAS,
    options?: { size?: number; bold?: boolean; maxWidth?: number }
  ) => {
    if (!text || !COORDENADAS_EXTRAS[coordKey]) return;

    const coord = COORDENADAS_EXTRAS[coordKey];
    const textFont = options?.bold ? fontBold : font;
    const textSize = options?.size || fontSize;

    // Truncar texto si excede maxWidth
    let displayText = text;
    if (options?.maxWidth) {
      const textWidth = textFont.widthOfTextAtSize(text, textSize);
      if (textWidth > options.maxWidth) {
        // Truncar y agregar "..."
        while (textFont.widthOfTextAtSize(displayText + '...', textSize) > options.maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
    }

    page.drawText(displayText, {
      x: coord.x,
      y: coord.y,
      size: textSize,
      font: textFont,
      color: rgb(0, 0, 0),
    });
  };

  // Función para dibujar texto en coordenadas personalizadas
  const drawTextAt = (
    page: any,
    text: string,
    x: number,
    y: number,
    options?: { size?: number; bold?: boolean }
  ) => {
    if (!text) return;

    const textFont = options?.bold ? fontBold : font;
    const textSize = options?.size || fontSize;

    page.drawText(text, {
      x,
      y,
      size: textSize,
      font: textFont,
      color: rgb(0, 0, 0),
    });
  };

  // ====== DIBUJAR INFORMACIÓN ESTÁTICA EN PRIMERA PÁGINA ======
  await dibujarInformacionEstatica(currentPage, datos, font, fontBold, fontSize, fontSizeSmall, pdfDoc);

  // ====== LLENAR MEDICAMENTOS ======
  // Caso 1: Sin medicamentos - mostrar texto especial
  if (datos.sinMedicamentos || !datos.medicamentos || datos.medicamentos.length === 0) {
    const textoSinMedicamentos = '***SIN MEDICAMENTOS***';
    const yPos = CONFIG_MEDICAMENTOS.inicio_y;

    // Dibujar el texto centrado en la sección de medicamentos
    currentPage.drawText(textoSinMedicamentos, {
      x: CONFIG_MEDICAMENTOS.columnas.indicaciones, // Centrado en la columna de indicaciones
      y: yPos,
      size: 12,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4), // Gris oscuro
    });
  }
  // Caso 2: Con medicamentos - mostrar lista normal
  else if (datos.medicamentos && datos.medicamentos.length > 0) {
    let currentY = CONFIG_MEDICAMENTOS.inicio_y;

    for (let i = 0; i < datos.medicamentos.length; i++) {
      const medicamento = datos.medicamentos[i];

      // Calcular líneas necesarias
      const nombreLines = medicamento.nombre
        ? wrapText(medicamento.nombre, CONFIG_MEDICAMENTOS.anchos.nombre, font, CONFIG_MEDICAMENTOS.tamano_fuente)
        : [];

      const indicacionesLines = medicamento.indicaciones
        ? wrapText(medicamento.indicaciones, CONFIG_MEDICAMENTOS.anchos.indicaciones, font, CONFIG_MEDICAMENTOS.tamano_fuente_indicaciones)
        : [];

      const tratamientoLines = medicamento.tratamiento
        ? wrapText(medicamento.tratamiento, CONFIG_MEDICAMENTOS.anchos.tratamiento, font, CONFIG_MEDICAMENTOS.tamano_fuente)
        : [];

      const maxLineas = Math.max(nombreLines.length, indicacionesLines.length, tratamientoLines.length, 1);
      const alturaTotal = (maxLineas * 10); // Altura de todas las líneas (mínimo 1 línea)

      // Verificar si cabe en la página actual
      if (currentY - alturaTotal < CONFIG_MEDICAMENTOS.limite_inferior_y) {
        // Crear nueva página copiando del template LIMPIO
        const [nuevaPagina] = await pdfDoc.copyPages(templateLimpio, [0]);
        pdfDoc.addPage(nuevaPagina);
        pages = pdfDoc.getPages();
        currentPage = pages[pages.length - 1];
        currentY = CONFIG_MEDICAMENTOS.inicio_y;

        // ⭐ IMPORTANTE: Dibujar información estática en la nueva página
        await dibujarInformacionEstatica(currentPage, datos, font, fontBold, fontSize, fontSizeSmall, pdfDoc);
      }

      // Dibujar en la posición actual
      const startY = currentY;

      // Fondo sutil cebra dibujado ANTES del texto para que no lo cubra
      if (i % 2 === 0) {
        currentPage.drawRectangle({
          x: 35,
          y: startY - alturaTotal + 4,
          width: 535,
          height: alturaTotal + 8,
          color: rgb(0.97, 0.97, 0.97),
        });
      }

      // Dibujar nombre (puede tener múltiples líneas)
      for (let j = 0; j < nombreLines.length; j++) {
        currentPage.drawText(nombreLines[j], {
          x: CONFIG_MEDICAMENTOS.columnas.nombre,
          y: startY - (j * 10),
          size: CONFIG_MEDICAMENTOS.tamano_fuente,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // Dibujar indicaciones (puede tener múltiples líneas, con fuente más pequeña)
      for (let j = 0; j < indicacionesLines.length; j++) {
        currentPage.drawText(indicacionesLines[j], {
          x: CONFIG_MEDICAMENTOS.columnas.indicaciones,
          y: startY - (j * 9),  // 9px entre líneas (menos espacio porque fuente es más pequeña)
          size: CONFIG_MEDICAMENTOS.tamano_fuente_indicaciones,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // Dibujar tratamiento (con soporte multilínea)
      for (let j = 0; j < tratamientoLines.length; j++) {
        currentPage.drawText(tratamientoLines[j], {
          x: CONFIG_MEDICAMENTOS.columnas.tratamiento,
          y: startY - (j * 10),
          size: CONFIG_MEDICAMENTOS.tamano_fuente,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      // Dibujar piezas (centrado)
      const piezasText = medicamento.piezas?.toString() || '';
      const piezasWidth = font.widthOfTextAtSize(piezasText, CONFIG_MEDICAMENTOS.tamano_fuente);
      const xPiezas = CONFIG_MEDICAMENTOS.columnas.piezas + (15 - piezasWidth / 2); // 30px col width aprox, center text

      currentPage.drawText(piezasText, {
        x: xPiezas,
        y: startY,
        size: CONFIG_MEDICAMENTOS.tamano_fuente,
        font: font,
        color: rgb(0, 0, 0),
      });

      // ====== INFORMACIÓN DE RESURTIMIENTO (SOLO EN COPIA PARA PACIENTE) ======
      let espacioExtraResurtimiento = 0;
      if ((datos.tipoReceta === 'paciente' || datos.tipoReceta === 'archivo') && medicamento.realizar_resurtimiento && medicamento.meses_resurtimiento) {
        const textoResurtimiento = `* RESURTIMIENTO por ${medicamento.meses_resurtimiento} ${medicamento.meses_resurtimiento === 1 ? 'mes' : 'meses'}`;
        const yResurtimiento = startY - alturaTotal - 2; // Justo debajo del medicamento

        currentPage.drawText(textoResurtimiento, {
          x: CONFIG_MEDICAMENTOS.columnas.nombre,
          y: yResurtimiento,
          size: 6, // Tamaño más pequeño
          font: fontBold,
          color: rgb(0, 0.4, 0.7), // Azul
        });

        espacioExtraResurtimiento = 10; // Espacio adicional para la nota de resurtimiento
      }

      // Mover Y hacia abajo para el siguiente medicamento
      currentY = currentY - alturaTotal - CONFIG_MEDICAMENTOS.espacio_entre_lineas - espacioExtraResurtimiento;
    }
  }

  // ====== LLENAR EXTRAS (solo en primera página) ======
  const firstPage = pages[0];
  drawText(firstPage, datos.incapacidad || '', 'incapacidad', { size: 9 });
  drawText(firstPage, datos.incapacidad_inicio || '', 'incapacidad_inicio', { size: 9 });
  drawText(firstPage, datos.incapacidad_fin || '', 'incapacidad_fin', { size: 9 });
  drawText(firstPage, datos.especialidad || '', 'especialidad', { size: 9 });

  // Firma del médico (si es texto)
  if (datos.firma_medico && typeof datos.firma_medico === 'string') {
    firstPage.drawText(datos.firma_medico, {
      x: 100,  // ← AJUSTAR coordenada X
      y: 80,   // ← AJUSTAR coordenada Y (debajo del nombre)
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  // Serializar PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Calcula cuántos medicamentos caben en una página
 * @returns Número máximo de medicamentos por página
 */
export function calcularMedicamentosPorPagina(): number {
  return MAX_MEDICAMENTOS_POR_PAGINA;
}

/**
 * Genera PDFs de receta separando medicamentos controlados en hojas individuales
 *
 * Lógica:
 * - Cada medicamento CONTROLADO → Hoja separada individual (PARA FARMACIA)
 * - Todos los medicamentos NO CONTROLADOS → Una sola hoja juntos (PARA FARMACIA)
 * - Hoja adicional con TODOS los medicamentos juntos (COPIA PARA EL PACIENTE) - solo si incluirCopiaPaciente = true
 *
 * @param datos Datos de la consulta y receta
 * @param incluirCopiaPaciente Si true, genera hoja adicional para el paciente (default: true)
 * @returns Buffer del PDF combinado
 */
export async function generarRecetasConSeparacionControlados(
  datos: DatosConsulta,
  incluirCopiaPaciente: boolean = true
): Promise<Uint8Array> {
  const medicamentos = datos.medicamentos || [];

  console.log(`📋 [Separación] Total medicamentos: ${medicamentos.length}`);
  console.log(`👤 [Separación] Incluir copia para paciente: ${incluirCopiaPaciente}`);

  // Separar medicamentos controlados de no controlados
  const medicamentosControlados = medicamentos.filter(m => m.clasificacion === 'CONTROLADO');
  const medicamentosNoControlados = medicamentos.filter(m => m.clasificacion !== 'CONTROLADO');

  console.log(`🔴 [Separación] Medicamentos CONTROLADOS: ${medicamentosControlados.length}`);
  console.log(`🟢 [Separación] Medicamentos NO CONTROLADOS: ${medicamentosNoControlados.length}`);

  const pdfsGenerados: Uint8Array[] = [];

  // 1. Generar PDF individual para cada medicamento CONTROLADO (PARA FARMACIA)
  for (const medicamento of medicamentosControlados) {
    console.log(`🔴 [PDF Controlado] Generando hoja para: ${medicamento.nombre}`);

    const datosPDFControlado = {
      ...datos,
      medicamentos: [medicamento],
      tipoReceta: 'farmacia' as const, // Marcar como para farmacia
      es_hoja_controlado: true, // Flag para mostrar leyenda de controlado
    };

    const pdfBytes = await generarRecetaPDF(datosPDFControlado);
    pdfsGenerados.push(pdfBytes);
  }

  // 2. Generar PDF con todos los medicamentos NO CONTROLADOS juntos (PARA FARMACIA)
  if (medicamentosNoControlados.length > 0) {
    console.log(`🟢 [PDF No Controlados] Generando hoja con ${medicamentosNoControlados.length} medicamento(s)`);

    const datosPDFNoControlados = {
      ...datos,
      medicamentos: medicamentosNoControlados,
      tipoReceta: 'farmacia' as const, // Marcar como para farmacia
    };

    const pdfBytes = await generarRecetaPDF(datosPDFNoControlados);
    pdfsGenerados.push(pdfBytes);
  }

  // 3. Generar COPIA PARA EL PACIENTE con TODOS los medicamentos juntos
  if (incluirCopiaPaciente) {
    console.log(`👤 [PDF Paciente] Generando copia para el paciente con ${medicamentos.length} medicamento(s)`);

    const datosPDFPaciente = {
      ...datos,
      medicamentos: medicamentos, // TODOS los medicamentos juntos
      tipoReceta: 'paciente' as const, // Marcar como para paciente
    };

    const pdfBytes = await generarRecetaPDF(datosPDFPaciente);
    pdfsGenerados.push(pdfBytes);

    // 3b. Generar COPIA PARA ARCHIVO (idéntica a la del paciente pero marcada como archivo)
    console.log(`📁 [PDF Archivo] Generando copia para archivo con ${medicamentos.length} medicamento(s)`);

    const datosPDFArchivo = {
      ...datos,
      medicamentos: medicamentos,
      tipoReceta: 'archivo' as const,
    };

    const pdfBytesArchivo = await generarRecetaPDF(datosPDFArchivo);
    pdfsGenerados.push(pdfBytesArchivo);
  }

  // 4. Si solo hay un PDF, retornarlo directamente
  if (pdfsGenerados.length === 1) {
    console.log(`✅ [Separación] Solo 1 PDF generado, retornando directamente`);
    return pdfsGenerados[0];
  }

  // 5. Combinar todos los PDFs en uno solo
  console.log(`📑 [Combinar] Combinando ${pdfsGenerados.length} PDFs...`);

  const pdfFinal = await PDFDocument.create();

  for (let i = 0; i < pdfsGenerados.length; i++) {
    const pdfActual = await PDFDocument.load(pdfsGenerados[i]);
    const paginasCopiadas = await pdfFinal.copyPages(pdfActual, pdfActual.getPageIndices());

    paginasCopiadas.forEach((pagina) => {
      pdfFinal.addPage(pagina);
    });

    console.log(`✅ [Combinar] PDF ${i + 1}/${pdfsGenerados.length} agregado`);
  }

  const pdfFinalBytes = await pdfFinal.save();
  console.log(`✅ [Separación] PDF final combinado generado con ${pdfFinal.getPageCount()} página(s)`);

  return pdfFinalBytes;
}
