// src/lib/templates/alerta-fondos-email.ts

import type { MedicamentoAlerta, ResumenAlertas } from '@/types/alertas-fondos';

interface DatosEmail {
  nombreDestinatario: string;
  fechaGeneracion: string;
  resumen: ResumenAlertas;
  medicamentosCriticos: MedicamentoAlerta[];
  urlSistema?: string;
}

// Colores por estado
const COLORES_ESTADO = {
  CRITICO: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
  BAJO: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  MEDIO: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
  NORMAL: { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
};

// Generar fila de medicamento para la tabla
function generarFilaMedicamento(med: MedicamentoAlerta, index: number): string {
  const colores = COLORES_ESTADO[med.estado];
  const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';

  return `
    <tr style="background-color: ${bgColor};">
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${med.nombre_comercial}</strong>
        <br/>
        <small style="color: #6b7280;">${med.sustancia_activa}</small>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${med.existencia_actual}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${med.fondo_fijo}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #dc2626; font-weight: bold;">
        ${med.faltante}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          background-color: ${colores.bg};
          color: ${colores.text};
          border: 1px solid ${colores.border};
        ">
          ${med.estado} (${med.porcentaje}%)
        </span>
      </td>
    </tr>
  `;
}

// Generar el HTML completo del correo
export function generarEmailAlertaFondos(datos: DatosEmail): string {
  const { nombreDestinatario, fechaGeneracion, resumen, medicamentosCriticos, urlSistema } = datos;

  const filasTabla = medicamentosCriticos
    .slice(0, 10) // Limitar a 10 medicamentos en el correo
    .map((med, index) => generarFilaMedicamento(med, index))
    .join('');

  const hayMas = medicamentosCriticos.length > 10;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Alerta de Fondos Fijos - Servicio Medico</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Mobile Styles */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
      .h1-mobile { font-size: 20px !important; }
    }

    /* Dark Mode Styles */
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background-color: #111827 !important; color: #f3f4f6 !important; }
      .container { background-color: #1f2937 !important; box-shadow: none !important; border: 1px solid #374151 !important; }
      .text-dark { color: #f3f4f6 !important; }
      .text-muted { color: #9ca3af !important; }
      .border-bottom { border-bottom: 1px solid #374151 !important; }
      .card-critico { background-color: #450a0a !important; border-color: #7f1d1d !important; }
      .card-bajo { background-color: #451a03 !important; border-color: #78350f !important; }
      .card-medio { background-color: #172554 !important; border-color: #1e3a8a !important; }
      .card-total { background-color: #374151 !important; border-color: #4b5563 !important; }
      .num-critico { color: #fca5a5 !important; }
      .num-bajo { color: #fcd34d !important; }
      .num-medio { color: #93c5fd !important; }
      .num-total { color: #e5e7eb !important; }
      .table-header { color: #ffffff !important; }
      .row-even { background-color: #1f2937 !important; }
      .row-odd { background-color: #262e3d !important; }
      .footer { background-color: #111827 !important; border-top: 1px solid #374151 !important; }
      .note-box { background-color: #0c4a6e !important; border-color: #164e63 !important; }
      .note-text { color: #cfFAfe !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;" class="wrapper">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;" class="wrapper">
    <tr>
      <td style="padding: 20px;" class="mobile-padding">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="container" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3acdb6 0%, #1c8ab7 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;" class="mobile-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: left; vertical-align: middle;" width="80">
                    <img src="cid:logo_pandora" alt="Logo Pandora" style="height: 70px; display: block;">
                  </td>
                  <td style="text-align: right; vertical-align: middle; padding-left: 20px;">
                    <h1 class="h1-mobile" style="margin: 0; color: #ffffff; font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); line-height: 1.2;">
                      Alerta de Fondos Fijos Bajos
                    </h1>
                    <p style="margin: 5px 0 0 0; color: #e0f2fe; font-size: 14px; letter-spacing: 0.5px;">
                      Servicio Medico - Sistema de Inventario
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px;" class="mobile-padding">

              <!-- Saludo -->
              <p class="text-dark" style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Estimado(a) <strong>${nombreDestinatario}</strong>,
              </p>

              <p class="text-dark" style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Se ha detectado que varios medicamentos en el inventario tienen niveles de existencia por debajo de su fondo fijo establecido. A continuacion se presenta un resumen:
              </p>

              <!-- Tarjetas de resumen -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 40px;">
                <tr>
                  <!-- Criticos -->
                  <td width="25%" style="padding: 0 8px;" class="mobile-stack">
                    <div class="card-critico" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px 10px; text-align: center;">
                      <div class="num-critico" style="font-size: 32px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">${resumen.criticos}</div>
                      <div class="num-critico" style="font-size: 11px; color: #991b1b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Criticos</div>
                    </div>
                  </td>
                  <!-- Bajos -->
                  <td width="25%" style="padding: 0 8px;" class="mobile-stack">
                    <div class="card-bajo" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px 10px; text-align: center;">
                      <div class="num-bajo" style="font-size: 32px; font-weight: bold; color: #d97706; margin-bottom: 5px;">${resumen.bajos}</div>
                      <div class="num-bajo" style="font-size: 11px; color: #92400e; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Bajos</div>
                    </div>
                  </td>
                  <!-- Medios -->
                  <td width="25%" style="padding: 0 8px;" class="mobile-stack">
                    <div class="card-medio" style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px 10px; text-align: center;">
                      <div class="num-medio" style="font-size: 32px; font-weight: bold; color: #0284c7; margin-bottom: 5px;">${resumen.medios}</div>
                      <div class="num-medio" style="font-size: 11px; color: #075985; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Medios</div>
                    </div>
                  </td>
                  <!-- Total -->
                  <td width="25%" style="padding: 0 8px;" class="mobile-stack">
                    <div class="card-total" style="background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 12px; padding: 20px 10px; text-align: center;">
                      <div class="num-total" style="font-size: 32px; font-weight: bold; color: #4b5563; margin-bottom: 5px;">${resumen.total_alertas}</div>
                      <div class="num-total" style="font-size: 11px; color: #374151; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Total</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Titulo tabla -->
              <h2 class="text-dark" style="margin: 0 0 20px 0; color: #111827; font-size: 18px; display: flex; align-items: center;">
                <span style="background-color: #1c8ab7; width: 4px; height: 18px; display: inline-block; margin-right: 10px; border-radius: 2px;"></span>
                Medicamentos con Mayor Urgencia
              </h2>

              <!-- Tabla de medicamentos -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 25px;">
                <thead>
                  <tr style="background: linear-gradient(90deg, #1c8ab7 0%, #3acdb6 100%);">
                    <th class="table-header" style="padding: 15px; text-align: left; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Medicamento</th>
                    <th class="table-header" style="padding: 15px; text-align: center; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Exist.</th>
                    <th class="table-header" style="padding: 15px; text-align: center; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Fondo</th>
                    <th class="table-header" style="padding: 15px; text-align: center; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Falta</th>
                    <th class="table-header" style="padding: 15px; text-align: center; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasTabla}
                </tbody>
              </table>

              ${hayMas ? `
              <p class="text-muted" style="margin: 0 0 25px 0; color: #6b7280; font-size: 13px; font-style: italic; text-align: center;">
                * Se muestran los 10 medicamentos mas criticos. Consulte el PDF adjunto para ver el reporte completo con ${medicamentosCriticos.length} medicamentos.
              </p>
              ` : ''}

              <!-- Mensaje PDF -->
              <div class="note-box" style="background-color: #ecfeff; border: 1px solid #cffafe; border-radius: 8px; padding: 20px; margin-bottom: 30px; display: flex; align-items: start;">
                 <p class="note-text" style="margin: 0; color: #155e75; font-size: 14px;">
                  <strong style="color: #0e7490;">Nota:</strong> Se adjunta un reporte PDF con el detalle completo de todos los medicamentos que requieren reposicion.
                </p>
              </div>

              ${urlSistema ? `
              <!-- Boton de acceso -->
              <div style="text-align: center; margin: 40px 0 10px 0;">
                <a href="${urlSistema}" style="
                  display: inline-block;
                  background: linear-gradient(90deg, #1c8ab7 0%, #3acdb6 100%);
                  color: #ffffff;
                  text-decoration: none;
                  padding: 14px 40px;
                  border-radius: 50px;
                  font-weight: bold;
                  font-size: 15px;
                  box-shadow: 0 4px 6px -1px rgba(28, 138, 183, 0.4);
                  transition: all 0.3s ease;
                ">
                  Acceder al Sistema
                </a>
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #f9fafb; padding: 25px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p class="text-muted" style="margin: 0 0 5px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Este correo fue generado automaticamente el ${fechaGeneracion}
              </p>
              <p class="text-muted" style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; font-weight: 500;">
                Servicio Medico - Sistema de Gestion de Inventario
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Generar asunto del correo
export function generarAsuntoAlerta(resumen: ResumenAlertas): string {
  if (resumen.criticos > 0) {
    return `[URGENTE] ${resumen.criticos} medicamento(s) en nivel CRITICO - Servicio Medico`;
  }
  if (resumen.bajos > 0) {
    return `[ALERTA] ${resumen.bajos} medicamento(s) con nivel BAJO - Servicio Medico`;
  }
  return `[AVISO] ${resumen.total_alertas} medicamento(s) requieren atencion - Servicio Medico`;
}
