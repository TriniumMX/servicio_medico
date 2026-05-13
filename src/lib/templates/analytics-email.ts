interface DatosAnalyticsEmail {
  destinatario: string;
  fechaGeneracion: string;
  periodo: { desde: string; hasta: string };
  resumenIncapacidades: {
    total: number;
    promedioSugeridos: number;
    promedioAutorizados: number;
  };
  resumenReferencias: {
    total: number;
    tiempoPromedio: number;
  };
  resumenInventario: {
    totalItems: number;
    criticos: number;
    bajos: number;
    valorTotal: number;
  };
}

export function generarEmailAnalytics(datos: DatosAnalyticsEmail): string {
  const { destinatario, fechaGeneracion, periodo, resumenIncapacidades, resumenReferencias, resumenInventario } = datos;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Reporte de Analytics - Servicio Medico</title>
  <style>
    :root { color-scheme: light dark; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background-color: #111827 !important; color: #f3f4f6 !important; }
      .container { background-color: #1f2937 !important; border: 1px solid #374151 !important; }
      .text-dark { color: #f3f4f6 !important; }
      .text-muted { color: #9ca3af !important; }
      .card { background-color: #374151 !important; border-color: #4b5563 !important; }
      .footer { background-color: #111827 !important; border-top: 1px solid #374151 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;" class="wrapper">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;" class="wrapper">
    <tr>
      <td style="padding: 20px;" class="mobile-padding">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="container" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;" class="mobile-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: left; vertical-align: middle;" width="80">
                    <img src="cid:logo_pandora" alt="Logo" style="height: 70px; display: block;">
                  </td>
                  <td style="text-align: right; vertical-align: middle; padding-left: 20px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; line-height: 1.2;">
                      Reporte de Analytics
                    </h1>
                    <p style="margin: 5px 0 0 0; color: #e0e7ff; font-size: 13px;">
                      Periodo: ${periodo.desde} al ${periodo.hasta}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px;" class="mobile-padding">
              <p class="text-dark" style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                Estimado(a) <strong>${destinatario}</strong>,
              </p>
              <p class="text-dark" style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Se adjunta el reporte de analytics del Servicio Medico correspondiente al periodo seleccionado. A continuacion un resumen ejecutivo:
              </p>

              <!-- Sección Incapacidades -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 0 0 10px 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                      <span style="background-color: #f59e0b; width: 4px; height: 18px; display: inline-block; border-radius: 2px;"></span>
                      <strong class="text-dark" style="color: #111827; font-size: 16px;">Incapacidades</strong>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="33%" style="padding: 0 5px;" class="mobile-stack">
                          <div class="card" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #d97706;">${resumenIncapacidades.total}</div>
                            <div style="font-size: 11px; color: #92400e; text-transform: uppercase; font-weight: 600;">Total</div>
                          </div>
                        </td>
                        <td width="33%" style="padding: 0 5px;" class="mobile-stack">
                          <div class="card" style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #b45309;">${resumenIncapacidades.promedioSugeridos}</div>
                            <div style="font-size: 11px; color: #92400e; text-transform: uppercase; font-weight: 600;">Dias Prom. Sug.</div>
                          </div>
                        </td>
                        <td width="33%" style="padding: 0 5px;" class="mobile-stack">
                          <div class="card" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #059669;">${resumenIncapacidades.promedioAutorizados}</div>
                            <div style="font-size: 11px; color: #065f46; text-transform: uppercase; font-weight: 600;">Dias Prom. Aut.</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Sección Referencias -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 0 0 10px 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                      <span style="background-color: #8b5cf6; width: 4px; height: 18px; display: inline-block; border-radius: 2px;"></span>
                      <strong class="text-dark" style="color: #111827; font-size: 16px;">Referencias a Especialistas</strong>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="50%" style="padding: 0 5px;" class="mobile-stack">
                          <div class="card" style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${resumenReferencias.total}</div>
                            <div style="font-size: 11px; color: #5b21b6; text-transform: uppercase; font-weight: 600;">Total Referencias</div>
                          </div>
                        </td>
                        <td width="50%" style="padding: 0 5px;" class="mobile-stack">
                          <div class="card" style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${resumenReferencias.tiempoPromedio}</div>
                            <div style="font-size: 11px; color: #5b21b6; text-transform: uppercase; font-weight: 600;">Dias Prom. Total</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Sección Inventario -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 0 0 10px 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                      <span style="background-color: #10b981; width: 4px; height: 18px; display: inline-block; border-radius: 2px;"></span>
                      <strong class="text-dark" style="color: #111827; font-size: 16px;">Inventario de Medicamentos</strong>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="25%" style="padding: 0 4px;" class="mobile-stack">
                          <div class="card" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #059669;">${resumenInventario.totalItems}</div>
                            <div style="font-size: 10px; color: #065f46; text-transform: uppercase; font-weight: 600;">Activos</div>
                          </div>
                        </td>
                        <td width="25%" style="padding: 0 4px;" class="mobile-stack">
                          <div class="card" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${resumenInventario.criticos}</div>
                            <div style="font-size: 10px; color: #991b1b; text-transform: uppercase; font-weight: 600;">Criticos</div>
                          </div>
                        </td>
                        <td width="25%" style="padding: 0 4px;" class="mobile-stack">
                          <div class="card" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #d97706;">${resumenInventario.bajos}</div>
                            <div style="font-size: 10px; color: #92400e; text-transform: uppercase; font-weight: 600;">Bajos</div>
                          </div>
                        </td>
                        <td width="25%" style="padding: 0 4px;" class="mobile-stack">
                          <div class="card" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 16px; font-weight: bold; color: #059669;">$${resumenInventario.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
                            <div style="font-size: 10px; color: #065f46; text-transform: uppercase; font-weight: 600;">Valor Total</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Nota archivo adjunto -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Nota:</strong> Se adjunta un archivo Excel (.xlsx) con el detalle completo de incapacidades, referencias e inventario.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="background-color: #f9fafb; padding: 25px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p class="text-muted" style="margin: 0 0 5px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Generado automaticamente el ${fechaGeneracion}
              </p>
              <p class="text-muted" style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; font-weight: 500;">
                Servicio Medico - Sistema de Analytics PANDORA
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
