// src/types/consultas.ts

export interface SignosVitales {
  // Campos nuevos de consulta
  id_consulta?: number;
  folio?: string;
  no_nomina?: string;
  nombre?: string;
  fecha_consulta?: string;
  es_empleado?: boolean;

  // Campos antiguos (mantener compatibilidad)
  id_signo_vital?: number;
  clavenomina?: string;
  clavepaciente?: number;
  nombrepaciente?: string;
  edad?: string | number;
  departamento?: string;
  clavestatus?: number;
  elpacienteesempleado?: boolean;
  parentesco_desc?: string;
  presion_arterial?: string;
  temperatura?: number;
  frecuencia_cardiaca?: number;
  oxigenacion?: number;
  altura?: number;
  peso?: number;
  glucosa?: number;
  fecha_registro?: string;
  id_usuario_registro?: number;
  observaciones?: string;
  activo?: boolean;
}

export interface Consulta {
  claveconsulta: number;
  no_nomina: string;
  parentesco: string;
  parentesco_desc?: string;
  nombrebeneficiario: string;
  fechaconsulta: string;
  clavestatus: number;
  fechacita?: string;
  nombre_empleado?: string;
  signos_vitales?: SignosVitales; // Relación con signos vitales
  // Agregar más campos según la estructura de tu BD
}

export interface ConsultasResponse {
  success: boolean;
  consultas?: Consulta[];
  error?: string;
}

// Nota Médica (Tabla NotaMedica)
export interface NotaMedica {
  folio_consulta: number;
  fechaconsulta: string | null;
  clavenomina: string | null;
  clavehospital: number | null;
  clave_doctor: number | null;
  clavepaciente: string | null;
  nombrepaciente: string | null;
  edad: string | null;
  elpacienteesempleado: string | null;
  parentesco: string | null;
  departamento: string | null;
  sindicato: string | null;
  cie_codigo: string | null;
  cie_titulo: string | null;
  cie_capitulo: string | null;
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  estatus_consulta: number | null;
  seAsignoIncapacidad: number | null;
  seasignoaespecialidad: string | null;
  especialidadinterconsulta: number | null;
  triage: number | null;
  fechacita: string | null;
  pronostico: number | null;
  costo: number | null;
  estatus: boolean | null;
  id_usuario_cancelo: number | null;
}

// Paciente en espera con signos vitales (usando nueva tabla consulta)
export interface PacienteEnEspera {
  // Campos nuevos de la tabla consulta
  id_consulta: number;
  folio: string;
  no_nomina: string;
  id_referencia_origen?: number | null;
  id_beneficiario?: number;
  nombre: string;
  edad?: number;
  sexo?: string;
  departamento?: string;
  sindicato?: string;
  es_empleado: boolean;
  parentesco_desc?: string;
  id_parentesco: number;
  presion_arterial: string;
  temperatura: number;
  frecuencia_cardiaca: number;
  oxigenacion?: number;
  saturacion_oxigeno?: number | null;
  altura?: number;
  peso?: number;
  glucosa?: number;
  fecha_consulta: string;
  estatus_consulta: number;

  // Alias para compatibilidad (campos antiguos)
  id_signo_vital?: number;
  clavenomina?: string;
  nombrepaciente?: string;
  elpacienteesempleado?: boolean;
  fecha_registro?: string;
  clavestatus?: number;
}

// Diagnóstico CIE-11 seleccionado
export interface DiagnosticoCIE11 {
  codigo: string;
  titulo: string;
  capitulo: string;
  es_principal?: boolean;
  orden?: number;
}

// Diagnóstico guardado en BD (con ID)
export interface DiagnosticoConsulta extends DiagnosticoCIE11 {
  id_diagnostico?: number;
  id_consulta?: number;
  creado_en?: string;
}

// Datos del formulario SOAP (Primera hoja)
export interface DatosSOAP {
  paciente: PacienteEnEspera;
  subjetivo: string;
  objetivo: string;
  diagnosticos: DiagnosticoCIE11[]; // Array de diagnósticos (puede tener múltiples)
  analisis: string;
}

// Plan de tratamiento (Segunda hoja) - Opciones seleccionadas
export interface OpcionesPlan {
  medicamentos: boolean;
  incapacidad: boolean;
  especialidad: boolean;
  laboratorio: boolean;
}

// Datos del Plan de Medicamentos
export interface Medicamento {
  clavemedicamento: string | number; // nvarchar en BDD, puede venir como string
  medicamento: string;
  clasificacion: string;
  presentacion: string;
  ean: string;
  piezas: number;
  maximo: number;
  minimo: number;
  medida: number;
  unidadmedida: string;
  stockstatus: 'stock bajo' | 'stock medio' | 'stock alto';
}

export interface MedicamentoRecetado {
  id_temp: string; // ID temporal para el frontend
  clavemedicamento: string | number; // nvarchar en BDD, puede venir como string
  nombre_medicamento: string;
  indicaciones: string;
  tratamiento_dias: number;
  piezas: number;
  realizar_resurtimiento: boolean;
  meses_resurtimiento: number | null; // 2, 3, 4, 5 o 6 meses
}

export interface HistorialMedicamento {
  medicamento: string;
  indicaciones: string;
  tratamiento: string;
  piezas: number;
  nombreproveedor: string;
  fechaemision: string;
}

export interface DatosMedicamentos {
  medicamentos: MedicamentoRecetado[];
}

// Datos del Plan de Incapacidad
export interface DatosIncapacidad {
  fecha_inicio: string;
  fecha_fin: string;
  dias: number; // Nota: La API espera "dias", no "dias_totales"
  motivo: string; // Observaciones adicionales
  // Diagnóstico CIE-11 que causa la incapacidad
  diagnostico_codigo: string;
  diagnostico_titulo: string;
}

// Datos del Plan de Especialidad (por desarrollar)
export interface DatosEspecialidad {
  // Se definirá cuando desarrollemos el módulo
  especialidad_id: number;
  motivo: string;
}

// Datos del Plan de Laboratorio (por desarrollar)
export interface DatosLaboratorio {
  // Se definirá cuando desarrollemos el módulo
  estudios: any[];
}

// Plan completo
export interface DatosPlan {
  opciones: OpcionesPlan;
  medicamentos?: DatosMedicamentos;
  incapacidad?: DatosIncapacidad;
  especialidad?: DatosEspecialidad;
  referencia_especialidad?: {
    id_especialidad_solicitada: number;
    motivo_referencia: string;
    nivel_triage?: number | null;
  };
  laboratorio?: DatosLaboratorio;
}

// Cache para datos del formulario
export interface CacheNotaMedica {
  id_consulta: number; // ⚠️ IMPORTANTE: Necesario para el UPDATE
  timestamp: string;
  hoja_actual: number;
  datos_soap: DatosSOAP | null;
  datos_plan: DatosPlan | null;
  sindicato?: string | null;
  // Aquí se agregarán más datos si es necesario
}

// DTO para el INSERT masivo con transacción
export interface InsertNotaMedicaDTO {
  // Datos del paciente
  clavenomina: string;
  clavehospital: number;
  clave_doctor: number;
  clavepaciente: string;
  nombrepaciente: string;
  edad: string;
  elpacienteesempleado: string; // 'S' o 'N'
  parentesco: string | null;
  departamento: string | null;
  sindicato: string | null;

  // Datos SOAP
  cie_codigo: string;
  cie_titulo: string;
  cie_capitulo: string;
  subjetivo: string;
  objetivo: string;
  analisis: string;

  // Datos del Plan
  seAsignoIncapacidad: number; // 0 o 1
  seasignoaespecialidad: string; // 'S' o 'N'
  especialidadinterconsulta: number | null;

  // Datos complementarios del Plan (se insertarán en otras tablas)
  plan_medicamentos?: DatosMedicamentos;
  plan_incapacidad?: DatosIncapacidad;
  plan_especialidad?: DatosEspecialidad;
  plan_referencia_especialidad?: {
    id_especialidad_solicitada: number;
    motivo_referencia: string;
    nivel_triage?: number | null;
  };
  plan_laboratorio?: DatosLaboratorio;
}

// =====================================================
// TIPOS PARA EL NUEVO MÓDULO DE RECETAS
// =====================================================

// Receta (tabla recetas)
export interface RecetaMedica {
  id_receta: number;
  id_consulta: number;
  folio_receta: string;
  fecha_emision: Date | string;
  vigencia_dias: number;
  observaciones_generales?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// Detalle de receta (tabla detalle_receta)
export interface DetalleRecetaMedica {
  id_detalle: number;
  id_receta: number;
  id_medicamento: number;
  cantidad_total: number;
  dosis: string;
  duracion_tratamiento_dias: number;
  via_administracion?: string;
  indicaciones?: string | null;
  realizar_resurtimiento: boolean;
  meses_resurtimiento?: number | null;
  created_at: Date | string;
  // Datos del medicamento (JOIN)
  nombre_comercial?: string;
  sustancia_activa?: string;
  medida?: string;
  abreviatura?: string;
}

// Surtimiento de receta (tabla surtimientos_receta)
export interface SurtimientoReceta {
  id_surtimiento: number;
  id_detalle: number;
  cantidad_surtida: number;
  fecha_surtimiento: Date | string;
  id_farmaceutico?: number | null;
  observaciones?: string | null;
  created_at: Date | string;
}

// DTO para crear una receta con sus detalles
export interface CrearRecetaDTO {
  id_consulta: number;
  vigencia_dias?: number; // Por defecto 30
  observaciones_generales?: string;
  medicamentos: NuevoDetalleRecetaDTO[];
}

// DTO para agregar un medicamento a la receta
export interface NuevoDetalleRecetaDTO {
  id_medicamento: number;
  cantidad_total: number;
  dosis: string; // ej: "1 tableta cada 8 horas"
  duracion_tratamiento_dias: number;
  via_administracion?: string; // Por defecto "Oral"
  indicaciones?: string;
  realizar_resurtimiento?: boolean;
  meses_resurtimiento?: number | null; // 1, 2, 3, 6 o 12
}

// DTO para surtir medicamentos
export interface SurtirMedicamentoDTO {
  id_detalle: number;
  cantidad_surtida: number;
  id_farmaceutico?: number;
  observaciones?: string;
}

// Receta completa con detalles y surtimientos (para consultas)
export interface RecetaCompleta extends RecetaMedica {
  detalles: DetalleRecetaConSurtimientos[];
}

// Detalle de receta con información de surtimientos
export interface DetalleRecetaConSurtimientos extends DetalleRecetaMedica {
  surtimientos: SurtimientoReceta[];
  total_surtido: number; // Suma de todas las cantidades surtidas
  pendiente_surtir: number; // cantidad_total - total_surtido
}

// Respuestas de API
export interface RecetaResponse {
  success: boolean;
  data?: RecetaMedica;
  error?: string;
  message?: string;
}

export interface RecetaCompletaResponse {
  success: boolean;
  data?: RecetaCompleta;
  error?: string;
}

export interface RecetasResponse {
  success: boolean;
  data?: RecetaCompleta[];
  error?: string;
}

// =====================================================
// TIPOS PARA CONTROL DE RESURTIMIENTOS
// =====================================================

export type EstatusResurtimiento = 'pendiente' | 'surtido' | 'vencido' | 'cancelado';

// Control de resurtimiento (cupón/vale)
export interface ControlResurtimiento {
  id_control: number;
  id_detalle: number;
  numero_resurtimiento: number;
  fecha_programada: string | Date;
  fecha_limite?: string | Date | null;
  estatus: EstatusResurtimiento;
  fecha_surtido?: string | Date | null;
  id_surtimiento?: number | null;
  observaciones?: string | null;
  created_at: string | Date;
}

// Resumen de cupones de un medicamento
export interface ResumenCupones {
  total_cupones: number;
  cupones_pendientes: number;
  cupones_surtidos: number;
  cupones_vencidos: number;
  cupones_cancelados?: number;
}

// Detalle de receta con cupones
export interface DetalleRecetaConCupones extends DetalleRecetaConSurtimientos {
  cupones: ControlResurtimiento[];
  resumen_cupones: ResumenCupones;
}

// Respuesta de API para cupones
export interface CuponesResponse {
  success: boolean;
  data?: {
    detalle: any;
    cupones: ControlResurtimiento[];
    resumen: ResumenCupones;
  };
  error?: string;
}
