// src/lib/nodemailer.ts

import nodemailer from 'nodemailer';

// Configuración del transporter de nodemailer
// Usa variables de entorno para la configuración SMTP

// Interfaz para las opciones de envío de correo
export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Crear el transporter de nodemailer
// Se crea de forma lazy para evitar errores si no hay configuración
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // Verificar que las variables de entorno estén configuradas
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'Configuración SMTP incompleta. Verifica las variables de entorno: SMTP_HOST, SMTP_USER, SMTP_PASS'
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true para 465, false para otros puertos
    auth: {
      user,
      pass,
    },
    // Opciones adicionales para Gmail
    ...(host.includes('gmail') && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  });

  return transporter;
}

// Verificar conexión SMTP
export async function verificarConexionSMTP(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return {
      success: true,
      message: 'Conexión SMTP verificada correctamente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al verificar conexión SMTP: ${error.message}`,
    };
  }
}

// Enviar correo electrónico
export async function enviarCorreo(options: MailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const transport = getTransporter();

    const smtpUser = process.env.SMTP_USER || '';
    // Si SMTP_FROM ya tiene formato "Nombre <correo>" lo usamos tal cual, si no, construimos uno personalizado
    let from = process.env.SMTP_FROM || smtpUser;

    if (!from.includes('<') && smtpUser) {
      from = `"ServicioMedico PANDORA" <${smtpUser}>`;
    }

    const info = await transport.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('Correo enviado:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Error al enviar correo:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Enviar correo a múltiples destinatarios
export async function enviarCorreoMultiple(
  destinatarios: Array<{ correo: string; nombre: string }>,
  subject: string,
  html: string,
  attachments?: MailOptions['attachments']
): Promise<{
  success: boolean;
  enviados: number;
  errores: string[];
}> {
  const errores: string[] = [];
  let enviados = 0;

  for (const destinatario of destinatarios) {
    const resultado = await enviarCorreo({
      to: destinatario.correo,
      subject,
      html,
      attachments,
    });

    if (resultado.success) {
      enviados++;
    } else {
      errores.push(`${destinatario.correo}: ${resultado.error}`);
    }
  }

  return {
    success: errores.length === 0,
    enviados,
    errores,
  };
}

// Exportar el transporter para casos específicos
export { getTransporter };
