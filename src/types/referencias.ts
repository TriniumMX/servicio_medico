// src/types/referencias.ts

/**
 * Tipos de estatus para referencias a especialidad
 */
export type EstatusReferencia =
  | 'pendiente_autorizar'
  | 'pendiente_asignar' // Legacy: datos existentes antes de la inversión del flujo
  | 'autorizada'
  | 'asignada'
  | 'notificada'
  | 'atendida'
  | 'cancelada'
  | 'inasistencia';

/**
 * Especialidad del catálogo
 */
export interface EspecialidadCatalogo {
  claveespecialidad: number;
  especialidad: string;
  especial: string;
  descripcion?: string;
  estatus: boolean;
}

/**
 * Médico especialista disponible
 */
export interface MedicoEspecialista {
  id_usuario: number;
  nombre: string;
  cedula_profesional?: string;
  id_especialidad: number;
  especialidad: string;
  email?: string;
  telefono?: string;
}

/**
 * Medicamento recetado en la consulta
 */
export interface MedicamentoRecetado {
  nombre_comercial: string;
  sustancia_activa: string;
  dosis: string;
  cantidad_total: number;
  duracion_tratamiento_dias: number;
  indicaciones: string;
  via_administracion: string;
}

/**
 * Estudio de laboratorio solicitado
 */
export interface EstudioLaboratorio {
  nombre_estudio: string;
  categoria: string;
  motivo: string;
  estatus: string;
}

/**
 * Incapacidad de la consulta
 */
export interface IncapacidadConsulta {
  fecha_inicio: string;
  fecha_fin: string;
  dias_sugeridos: number;
  dias_autorizados: number | null;
  motivo_medico: string;
  estatus: string;
}

/**
 * Referencia a especialidad completa
 */
export interface ReferenciaEspecialidad {
  // ID principal
  id_referencia: number;

  // Folio único de referencia (ej: REF-A7K9M)
  folio: string | null;

  // Relación con consultas
  id_consulta_origen: number;
  id_consulta_seguimiento: number | null;
  id_consulta?: number;

  // Información del paciente (snapshot)
  no_nomina: string;
  id_beneficiario?: number;
  es_empleado?: boolean;
  nombre_paciente: string;
  edad?: number;
  sexo?: string;
  departamento?: string;
  telefono?: string | null;
  email?: string | null;

  // Médico que refiere
  id_medico_refiere: number;
  nombre_medico_refiere: string;

  // Especialidad solicitada
  id_especialidad_solicitada: number;
  nombre_especialidad: string;
  motivo_referencia: string;

  // Asignación de médico especialista (FASE 2: Hospital)
  id_medico_asignado: number | null;
  nombre_medico_asignado?: string;
  fecha_cita: string | null;
  id_usuario_asigna: number | null;
  nombre_usuario_asigna?: string;
  fecha_asignacion: string | null;

  // Autorización (FASE 3: Coordinador)
  id_coordinador_autoriza: number | null;
  nombre_coordinador?: string;
  cargo_coordinador?: string;
  fecha_autorizacion: string | null;
  observaciones_coordinador: string | null;
  firma_digital: string | null;

  // Notificación al paciente (FASE 4: Admin Referencias)
  id_usuario_notifica: number | null;
  nombre_usuario_notifica?: string;
  fecha_notificacion: string | null;
  observaciones_notificacion: string | null;
  medio_notificacion?: string | null;

  // Atención (FASE 5: Médico Especialista)
  fecha_atencion: string | null;

  // Inasistencia (FASE 5b)
  motivo_inasistencia?: string | null;
  id_usuario_inasistencia?: number | null;
  nombre_usuario_inasistencia?: string | null;
  fecha_inasistencia?: string | null;

  // Control de estatus
  estatus: EstatusReferencia;
  activo: boolean;

  // Nivel de triage de la referencia (1=Emergencia, 2=Urgente, 3=Semi-urgente, 4=Programable, 5=Electiva)
  nivel_triage?: number | null;

  // Seguimiento post-consulta
  tipo_referencia?: 'normal' | 'seguimiento';
  fecha_sugerida_seguimiento?: string | null;
  id_medico_sugerido?: number | null;
  nombre_medico_sugerido?: string | null;

  // Número secuencial de consulta para el paciente en la misma especialidad (1=primera, 2=seguimiento, etc.)
  numero_consulta?: number | null;

  // Control de contrareferencias y seguimiento ya creados
  tiene_contrareferencia?: boolean;
  tiene_seguimiento?: boolean;
  id_contrareferencia?: number | null;

  // Auditoría
  creado_en: string;
  actualizado_en: string;

  // ========== DATOS SOAP DE LA CONSULTA ORIGEN ==========
  subjetivo?: string | null;
  objetivo?: string | null;
  analisis?: string | null;
  plan_tratamiento?: string | null;

  // Diagnóstico CIE-11
  cie11_codigo?: string | null;
  cie11_titulo?: string | null;
  cie11_capitulo?: string | null;

  // Flags de tratamiento
  se_asigno_incapacidad?: boolean;
  tiene_estudios_laboratorio?: boolean;

  // Signos vitales
  temperatura_c?: number | null;
  ta_sistolica?: number | null;
  ta_diastolica?: number | null;
  frecuencia_cardiaca?: number | null;
  oxigenacion?: number | null;
  altura_cm?: number | null;
  peso_kg?: number | null;
  glucosa_mg_dl?: number | null;

  // ========== DATOS DE TRATAMIENTO ==========
  medicamentos_recetados?: MedicamentoRecetado[] | null;
  estudios_laboratorio?: EstudioLaboratorio[] | null;
  incapacidad?: IncapacidadConsulta | null;

  // ========== TODOS LOS DIAGNÓSTICOS CIE-11 ==========
  diagnosticos?: DiagnosticoReferencia[] | null;
}

/**
 * Diagnóstico CIE-11 para referencias
 */
export interface DiagnosticoReferencia {
  cie11_codigo: string;
  cie11_titulo: string;
  cie11_capitulo?: string;
  es_principal: boolean;
  orden: number;
}

/**
 * DTO para crear una nueva referencia (FASE 1: Médico General)
 */
export interface CrearReferenciaRequest {
  id_consulta: number;
  id_especialidad_solicitada: number;
  motivo_referencia: string;
}

/**
 * DTO para asignar médico especialista (FASE 2: Hospital)
 */
export interface AsignarMedicoRequest {
  id_referencia: number;
  id_medico_asignado: number;
  fecha_cita: string; // ISO 8601 format
}

/**
 * DTO para autorizar referencia (FASE 3: Coordinador)
 */
export interface AutorizarReferenciaRequest {
  id_referencia: number;
  observaciones_coordinador?: string;
  firma_digital?: string;
}

/**
 * DTO para rechazar referencia (FASE 3: Coordinador)
 */
export interface RechazarReferenciaRequest {
  id_referencia: number;
  motivo_rechazo: string;
}

/**
 * DTO para notificar al paciente (FASE 4: Admin Referencias)
 */
export interface NotificarPacienteRequest {
  id_referencia: number;
  observaciones_notificacion: string;
}

/**
 * DTO para registrar la atención del especialista (FASE 5: Médico Especialista)
 */
export interface RegistrarAtencionRequest {
  id_referencia: number;
  id_consulta_seguimiento: number;
}

/**
 * Consulta con referencia origen
 */
export interface ConsultaConReferencia {
  id_consulta: number;
  folio: string;
  id_referencia_origen?: number;
  referencia_origen?: ReferenciaEspecialidad;
  // Agregar más campos de consulta según necesidad
}

/**
 * Historial completo del paciente para el especialista
 */
export interface HistorialPaciente {
  paciente: {
    no_nomina: string;
    nombre: string;
    edad?: number;
    sexo?: string;
    departamento?: string;
  };
  consultas: any[]; // Usar tipo Consulta completo cuando esté disponible
  referencias: ReferenciaEspecialidad[];
  recetas: any[]; // Usar tipo Receta completo cuando esté disponible
}

/**
 * Opción de referencia en el Plan de Tratamiento
 */
export interface OpcionReferencia {
  id_especialidad_solicitada: number;
  motivo_referencia: string;
  nivel_triage?: number | null;
}

/**
 * Datos del plan de tratamiento con referencia
 */
export interface DatosPlanConReferencia {
  // Opciones del plan
  opciones: {
    medicamento: boolean;
    incapacidad: boolean;
    especialidad: boolean;
    laboratorio: boolean;
  };

  // Datos de referencia (solo si opciones.especialidad === true)
  referencia_especialidad?: OpcionReferencia;

  // Otros datos del plan...
}

/**
 * Estadísticas de referencias (para dashboards)
 */
export interface EstadisticasReferencias {
  total: number;
  pendiente_autorizar: number;
  pendiente_asignar: number; // Legacy
  autorizada: number;
  asignada: number;
  notificada: number;
  atendida: number;
  cancelada: number;
  tiempo_promedio_dias?: number;
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Respuesta para lista de referencias
 */
export interface ReferenciasResponse {
  success: boolean;
  referencias?: ReferenciaEspecialidad[];
  total?: number;
  error?: string;
}

/**
 * Respuesta para una sola referencia
 */
export interface ReferenciaResponse {
  success: boolean;
  referencia?: ReferenciaEspecialidad;
  error?: string;
}

/**
 * Respuesta para lista de especialidades
 */
export interface EspecialidadesResponse {
  success: boolean;
  especialidades?: EspecialidadCatalogo[];
  error?: string;
}

/**
 * Respuesta para lista de médicos especialistas
 */
export interface MedicosEspecialistasResponse {
  success: boolean;
  medicos?: MedicoEspecialista[];
  error?: string;
}
