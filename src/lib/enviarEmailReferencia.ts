import fs from 'fs';
import path from 'path';
import { executeQueryOne } from './dbPostgres';
import { enviarCorreo } from './nodemailer';
import { generarEmailCitaReferencia } from './templates/referencia-cita-email';
import { generarUrlPublica } from './receta-token';

/**
 * Envía un correo al paciente cuando su cita de referencia es asignada o reprogramada.
 * Solo envía si el paciente registró su email en la página del QR.
 */
export async function enviarEmailCitaReferencia(
  idReferencia: number,
  tipo: 'asignada' | 'reprogramada'
): Promise<void> {
  try {
    // Obtener datos de la referencia + email del paciente
    const referencia = await executeQueryOne<{
      nombre_paciente: string;
      nombre_especialidad: string;
      folio: string;
      fecha_cita: Date | null;
      email_notificacion: string | null;
      id_consulta_origen: number;
      nombre_medico: string | null;
    }>(`
      SELECT
        re.nombre_paciente,
        re.nombre_especialidad,
        re.folio,
        re.fecha_cita,
        re.email_notificacion,
        re.id_consulta_origen,
        u.nombre AS nombre_medico
      FROM referencias_especialidad re
      LEFT JOIN usuarios u ON re.id_medico_asignado = u.id_usuario
      WHERE re.id_referencia = $1
    `, [idReferencia]);

    if (!referencia?.email_notificacion || !referencia.fecha_cita) return;

    // Buscar el token QR de la receta ligada a esta consulta
    const tokenData = await executeQueryOne<{ token: string }>(`
      SELECT rap.token
      FROM recetas_acceso_publico rap
      JOIN recetas r ON rap.id_receta = r.id_receta
      WHERE r.id_consulta = $1
        AND rap.activo = true
        AND rap.fecha_expiracion > NOW()
      ORDER BY rap.fecha_creacion DESC
      LIMIT 1
    `, [referencia.id_consulta_origen]);

    if (!tokenData) return;

    const urlQR = generarUrlPublica(tokenData.token);

    const fechaCitaFormateada = new Date(referencia.fecha_cita).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = generarEmailCitaReferencia({
      nombrePaciente: referencia.nombre_paciente,
      especialidad: referencia.nombre_especialidad,
      folio: referencia.folio,
      nombreMedico: referencia.nombre_medico ?? 'Por confirmar',
      fechaCita: fechaCitaFormateada,
      urlQR,
      reprogramada: tipo === 'reprogramada',
    });

    const asunto = tipo === 'reprogramada'
      ? `[${referencia.folio}] Tu cita con el especialista fue reprogramada`
      : `[${referencia.folio}] Tu cita con el especialista fue asignada`;

    // Logo incrustado como CID (igual que en alertas-fondos)
    const attachments: any[] = [];
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo_pandora.png');
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: 'logo_pandora.png',
          content: fs.readFileSync(logoPath),
          cid: 'logo_pandora',
        });
      }
    } catch (e) {
      console.error('Error al leer el logo para el correo de referencia:', e);
    }

    await enviarCorreo({
      to: referencia.email_notificacion,
      subject: asunto,
      html,
      attachments,
    });

    console.log(`📧 Email de referencia (${tipo}) enviado a ${referencia.email_notificacion}`);
  } catch (error) {
    console.error('❌ Error enviando email de referencia:', error);
  }
}
