// =============================================
// Tipos TypeScript para Contrareferencias
// Descripción: Definiciones de tipos para el módulo de contrareferencias
// Fecha: 2026-01-13
// =============================================

/**
 * Tipos de estatus para contrareferencias
 */
export type EstatusContrareferencia = 'pendiente' | 'vista' | 'cerrada';

/**
 * Contrareferencia completa
 */
export interface Contrareferencia {
  id_contrareferencia: number;
  folio: string;

  // Relaciones
  id_referencia_origen: number;
  id_consulta_especialista: number;

  // Médico que contrarrefiere
  id_medico_contrarrefiere: number;
  nombre_medico_contrarrefiere: string;
  id_especialidad_remitente: number;
  nombre_especialidad_remitente: string;

  // Médico destino
  id_medico_destino: number;
  nombre_medico_destino: string;

  // Paciente
  no_nomina: string;
  id_beneficiario: number;
  nombre_paciente: string;

  // Contenido SOAP
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  plan_texto: string | null;
  cie11_codigo: string | null;
  cie11_titulo: string | null;
  observaciones_especialista: string | null;

  // Cascada
  es_parte_cascada: boolean;
  id_contrareferencia_padre: number | null;
  nivel_cascada: number;

  // Control
  estatus: EstatusContrareferencia;
  fecha_vista: string | null;
  activo: boolean;

  // Auditoría
  creado_en: string;
  actualizado_en: string;
}

/**
 * DTO para crear contrareferencia
 */
export interface CrearContrarreferencia {
  id_referencia: number;
  observaciones_especialista?: string;
}

/**
 * Respuesta de API para lista de contrareferencias
 */
export interface ContrarreferenciasListResponse {
  success: boolean;
  contrareferencias?: Contrareferencia[];
  total?: number;
  error?: string;
}

/**
 * Respuesta de API para operación de contrareferencia
 */
export interface ContrarreferenciasResponse {
  success: boolean;
  data?: Contrareferencia;
  message?: string;
  error?: string;
}

/**
 * Información de cascada de contrareferencias
 */
export interface InfoCascada {
  debe_continuar_cascada: boolean;
  id_referencia_siguiente?: number;
  nombre_medico_siguiente?: string;
  es_medico_general?: boolean;
  nivel_actual?: number;
}

/**
 * Filtros para listar contrareferencias
 */
export type FiltroContrareferencias = 'pendientes' | 'vistas' | 'todas';

/**
 * Contrareferencia con datos extendidos (para detalle)
 */
export interface ContrarreferenciasDetalle extends Contrareferencia {
  // Datos adicionales de la referencia original
  folio_referencia_origen?: string;
  motivo_referencia_original?: string;
  diagnosticos_json?: { codigo: string; titulo: string; es_principal: boolean }[];

  // Datos del médico que contrarrefiere
  cedula_especialista?: string;
  email_especialista?: string;

  // Info de cascada
  info_cascada?: InfoCascada;

  // Historial relacionado
  contrareferencias_relacionadas?: Contrareferencia[];
}

/**
 * Payload de notificación Pusher para contrareferencias
 */
export interface NotificacionContrarreferencia {
  tipo: 'contrareferencia';
  titulo: string;
  mensaje: string;
  datos: {
    id_contrareferencia: number;
    folio: string;
    id_medico_destino: number;
    nombre_paciente: string;
    especialidad_remitente: string;
  };
}

/**
 * Respuesta de marcar como vista
 */
export interface MarcarVistaResponse {
  success: boolean;
  message?: string;
  error?: string;
}
