interface DatosCitaReferenciaEmail {
  nombrePaciente: string;
  especialidad: string;
  folio: string;
  nombreMedico: string;
  fechaCita: string;
  urlQR: string;
  reprogramada: boolean;
}

export function generarEmailCitaReferencia(datos: DatosCitaReferenciaEmail): string {
  const { nombrePaciente, especialidad, folio, nombreMedico, fechaCita, urlQR, reprogramada } = datos;

  const tituloHeader = reprogramada
    ? 'Cita Reprogramada'
    : 'Cita Asignada';

  const subtituloHeader = reprogramada
    ? 'El hospital actualizó los datos de tu cita con el especialista'
    : 'El hospital asignó tu cita con el especialista';

  const mensajePrincipal = reprogramada
    ? `El hospital reprogramó la fecha para tu cita con el médico de <strong>${especialidad}</strong>, <strong>"${nombreMedico}"</strong>. La nueva fecha y hora es: <strong>${fechaCita}</strong>. Lamentamos los inconvenientes.`
    : `Se ha asignado tu cita médica con el especialista de <strong>${especialidad}</strong>. A continuación encontrarás los detalles de tu cita.`;

  const iconoEstado = reprogramada
    ? `<span style="font-size:28px;">🔄</span>`
    : `<span style="font-size:28px;">✅</span>`;

  const colorBanner = reprogramada ? '#fbbf24' : '#3acdb6';
  const colorBannerBg = reprogramada ? '#fffbeb' : '#f0fdfa';
  const colorBannerBorder = reprogramada ? '#fde68a' : '#99f6e4';
  const colorBannerText = reprogramada ? '#92400e' : '#134e4a';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${tituloHeader} - Servicio Medico Pandora</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background-color: #111827 !important; color: #f3f4f6 !important; }
      .container { background-color: #1f2937 !important; box-shadow: none !important; border: 1px solid #374151 !important; }
      .text-dark { color: #f3f4f6 !important; }
      .text-muted { color: #9ca3af !important; }
      .card-dato { background-color: #374151 !important; border-color: #4b5563 !important; }
      .label-dato { color: #9ca3af !important; }
      .value-dato { color: #f3f4f6 !important; }
      .footer { background-color: #111827 !important; border-top: 1px solid #374151 !important; }
      .btn-ver { background: linear-gradient(90deg, #1c8ab7 0%, #3acdb6 100%) !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f3f4f6;" class="wrapper">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f3f4f6;" class="wrapper">
    <tr>
      <td style="padding:20px;" class="mobile-padding">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="container"
          style="max-width:680px; margin:0 auto; background-color:#ffffff; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); overflow:hidden;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background: linear-gradient(135deg, #3acdb6 0%, #1c8ab7 100%); padding:30px 40px; border-radius:12px 12px 0 0;" class="mobile-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;" width="80">
                    <img src="cid:logo_pandora" alt="Pandora" style="height:64px; display:block;">
                  </td>
                  <td style="vertical-align:middle; padding-left:20px;">
                    <p style="margin:0 0 4px 0; font-size:11px; color:#ccfbf1; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">
                      Sistema Médico Pandora SJR
                    </p>
                    <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff; line-height:1.3; text-shadow:0 1px 3px rgba(0,0,0,0.15);">
                      ${tituloHeader}
                    </h1>
                    <p style="margin:6px 0 0; font-size:13px; color:#ccfbf1; line-height:1.4;">
                      ${subtituloHeader}
                    </p>
                  </td>
                  <td style="vertical-align:middle; text-align:right; padding-left:16px; white-space:nowrap;">
                    ${iconoEstado}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ CONTENIDO PRINCIPAL ═══ -->
          <tr>
            <td style="padding:36px 40px 0;" class="mobile-padding">

              <!-- Folio badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="background:linear-gradient(90deg,#f0fdfa,#ecfeff); border:1px solid #99f6e4; border-radius:10px; padding:14px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <p style="margin:0; font-size:11px; color:#0d9488; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Folio de Referencia</p>
                          <p style="margin:4px 0 0; font-size:20px; font-weight:800; color:#0f766e; font-family:monospace; letter-spacing:3px;">${folio}</p>
                        </td>
                        <td style="text-align:right; vertical-align:middle;">
                          <span style="font-size:26px;">🏥</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Mensaje principal -->
              <p class="text-dark" style="margin:0 0 28px; font-size:15px; color:#374151; line-height:1.7;">
                Estimado(a) <strong>${nombrePaciente}</strong>,<br><br>
                ${mensajePrincipal}
              </p>

              <!-- Banner de estado (reprogramada/asignada) -->
              <div style="background-color:${colorBannerBg}; border:1px solid ${colorBannerBorder}; border-left:4px solid ${colorBanner}; border-radius:8px; padding:16px 20px; margin-bottom:28px;">
                <p style="margin:0; font-size:13px; color:${colorBannerText}; font-weight:600;">
                  ${reprogramada ? '⚠️ Tu cita fue reprogramada. Verifica la nueva fecha.' : '🎉 ¡Tu cita ha sido confirmada!'}
                </p>
              </div>

              <!-- Título sección datos -->
              <h2 class="text-dark" style="margin:0 0 16px; font-size:15px; color:#111827; font-weight:700; display:flex; align-items:center;">
                <span style="display:inline-block; background-color:#1c8ab7; width:4px; height:16px; margin-right:10px; border-radius:2px; vertical-align:middle;"></span>
                Datos de tu Cita
              </h2>

              <!-- Tarjetas de datos -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
                <tr>
                  <td class="card-dato" style="background:#f9fafb; padding:16px 20px; border-bottom:1px solid #e5e7eb; width:50%;">
                    <p class="label-dato" style="margin:0 0 4px; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Paciente</p>
                    <p class="value-dato" style="margin:0; font-size:14px; color:#111827; font-weight:600;">${nombrePaciente}</p>
                  </td>
                  <td class="card-dato" style="background:#f9fafb; padding:16px 20px; border-bottom:1px solid #e5e7eb;">
                    <p class="label-dato" style="margin:0 0 4px; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Especialidad</p>
                    <p class="value-dato" style="margin:0; font-size:14px; color:#111827; font-weight:600;">${especialidad}</p>
                  </td>
                </tr>
                <tr>
                  <td class="card-dato" style="background:#ffffff; padding:16px 20px; border-bottom:1px solid #e5e7eb;">
                    <p class="label-dato" style="margin:0 0 4px; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Especialista</p>
                    <p class="value-dato" style="margin:0; font-size:14px; color:#111827; font-weight:600;">${nombreMedico}</p>
                  </td>
                  <td class="card-dato" style="background:#ffffff; padding:16px 20px; border-bottom:1px solid #e5e7eb;">
                    <p class="label-dato" style="margin:0 0 4px; font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Fecha y Hora</p>
                    <p class="value-dato" style="margin:0; font-size:14px; color:#0f766e; font-weight:700;">${fechaCita}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ CTA ═══ -->
          <tr>
            <td style="padding:0 40px 36px;" class="mobile-padding">
              <p class="text-muted" style="margin:0 0 16px; font-size:13px; color:#6b7280; line-height:1.6;">
                Consulta tu receta médica y el estado actualizado de tu referencia en cualquier momento:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius:50px; background:linear-gradient(90deg, #1c8ab7 0%, #3acdb6 100%); box-shadow:0 4px 6px -1px rgba(28,138,183,0.4);">
                    <a href="${urlQR}" target="_blank" class="btn-ver"
                      style="display:inline-block; padding:14px 36px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.3px; border-radius:50px;">
                      Ver mi Receta →
                    </a>
                  </td>
                </tr>
              </table>
              <p class="text-muted" style="margin:12px 0 0; font-size:11px; color:#9ca3af; word-break:break-all;">
                ${urlQR}
              </p>
            </td>
          </tr>

          <!-- ═══ AVISO IMPORTANTE ═══ -->
          <tr>
            <td style="padding:0 40px 36px;" class="mobile-padding">
              <div style="background-color:#ecfeff; border:1px solid #cffafe; border-radius:8px; padding:16px 20px;">
                <p style="margin:0; font-size:13px; color:#155e75; line-height:1.6;">
                  <strong style="color:#0e7490;">⚠️ Importante:</strong>
                  Para recibir tu turno con el especialista, acércate a la administración del servicio médico con esta información y tu identificación.
                </p>
              </div>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td class="footer" style="background-color:#f9fafb; padding:24px 40px; border-top:1px solid #e5e7eb; border-radius:0 0 12px 12px;">
              <p class="text-muted" style="margin:0 0 4px; font-size:12px; color:#9ca3af; text-align:center;">
                Este correo fue enviado porque solicitaste notificaciones de tu referencia médica.
              </p>
              <p class="text-muted" style="margin:0; font-size:12px; color:#6b7280; text-align:center; font-weight:500;">
                Servicio Médico Pandora SJR 2.0
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
