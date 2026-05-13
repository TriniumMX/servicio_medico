// src/types/farmacia/resurtimiento.ts

// =====================================================
// Tipos para Cupones de Resurtimiento
// =====================================================

export interface Cupon {
  id_control: number;
  id_detalle: number;
  numero_resurtimiento: number;
  fecha_programada: string;
  fecha_limite: string | null;
  estatus: 'pendiente' | 'surtido' | 'vencido' | 'cancelado';
  fecha_surtido: string | null;
  id_surtimiento: number | null;
  observaciones: string | null;
  created_at: string;
  disponible_para_resurtir?: boolean; // ✨ Indica si está dentro de ventana de tolerancia
  receta_resurtimiento?: { // ✨ Información de receta de resurtimiento ya generada
    folio: string;
    fecha_generacion: string;
    id_receta: number;
  } | null;
}

export interface MedicamentoInfo {
  id_medicamento: number;
  nombre_comercial: string;
  sustancia_activa: string;
}

export interface PrescripcionInfo {
  cantidad_total: number;
  dosis: string;
  duracion_tratamiento_dias: number;
  meses_resurtimiento: number | null;
}

export interface CuponesInfo {
  todos: Cupon[];
  surtidos: Cupon[];
  pendientes: Cupon[]; // Todos los pendientes (con campo disponible_para_resurtir)
  disponibles: Cupon[]; // ✨ Solo los que están dentro de ventana
  fuera_ventana: Cupon[]; // ✨ Los que están fuera de ventana
  excluidos_cupon_1: Cupon[];
  total_cupones: number;
  cupones_surtidos: number;
  cupones_pendientes: number; // Total de pendientes
  cupones_disponibles: number; // ✨ Solo disponibles
  cupones_fuera_ventana: number; // ✨ Fuera de ventana
  cupones_excluidos_cupon_1: number;
}

export interface MedicamentoConCupones {
  id_detalle: number;
  medicamento: MedicamentoInfo;
  prescripcion: PrescripcionInfo;
  cupones: CuponesInfo;
}

export interface RecetaInfo {
  id_receta: number;
  folio_receta: string;
  fecha_emision: string;
}

export interface PacienteInfo {
  nomina: string;
  nombre: string;
}

export interface ConsultaInfo {
  folio: string;
  diagnostico: string;
}

export interface ResumenResurtimientos {
  total_medicamentos_con_resurtimiento: number;
  medicamentos_con_cupones_pendientes: number;
  medicamentos_con_cupones_disponibles: number; // ✨ Nuevo
  total_cupones_pendientes: number; // Total de pendientes (incluye disponibles y fuera ventana)
  total_cupones_disponibles: number; // ✨ Solo disponibles (dentro de ventana)
  total_cupones_fuera_ventana: number; // ✨ Fuera de ventana
  total_cupones_surtidos: number;
  total_cupones_excluidos_cupon_1: number;
}

export interface ResurtimientosData {
  receta: RecetaInfo;
  paciente: PacienteInfo;
  consulta: ConsultaInfo;
  medicamentos: MedicamentoConCupones[];
  medicamentos_con_pendientes: MedicamentoConCupones[];
  resumen: ResumenResurtimientos;
}

export interface ResurtimientosResponse {
  success: boolean;
  data?: ResurtimientosData;
  error?: string;
  // Campos de receta cancelada
  receta_cancelada?: boolean;
  motivo_cancelacion?: string | null;
  fecha_cancelacion?: string | null;
  usuario_cancelo?: { nombre: string; username: string } | null;
}

// =====================================================
// Tipos para Receta de Resurtimiento Imprimible
// =====================================================
// ⚠️ DEPRECADO: Ya no se usa componente React para imprimir
// Ahora se usa el PDF endpoint directamente (/api/recetas/generar-pdf/[id_receta])
// Se deja comentado por compatibilidad temporal

// export interface MedicamentoResurtimiento {
//   nombre_comercial: string;
//   sustancia_activa: string;
//   dosis: string;
//   cantidad_total: number;
//   numero_resurtimiento: number;
//   id_control: number;
// }

// export interface RecetaResurtimientoData {
//   folio_receta_original: string;
//   folio_receta: string; // Folio de la nueva receta de resurtimiento
//   fecha_emision: string;
//   paciente: {
//     nombre: string;
//     nomina: string;
//   };
//   medicamentos: MedicamentoResurtimiento[];
// }

// =====================================================
// Tipos para Generación de Receta de Resurtimiento
// =====================================================

export interface CuponParaResurtimiento {
  id_control: number;
  id_medicamento: number;
  cantidad: number;
  dosis: string;
  numero_resurtimiento: number;
}

export interface GenerarResurtimientoRequest {
  folio_original: string;
  cupones: CuponParaResurtimiento[];
}

export interface MedicamentoRecetaGenerada {
  id_detalle: number;
  nombre_comercial: string;
  sustancia_activa: string;
  presentacion: string;
  dosis: string;
  cantidad_total: number;
  via_administracion: string;
  indicaciones: string;
  cupones: number[]; // Números de resurtimiento
}

export interface RecetaGeneradaData {
  receta: {
    id_receta: number;
    folio_receta: string;
    fecha_emision: string;
    tipo_receta: string;
    folio_receta_original: string;
  };
  paciente: {
    nombre: string;
    nomina: string;
  };
  medicamentos: MedicamentoRecetaGenerada[];
}

export interface GenerarResurtimientoResponse {
  success: boolean;
  message?: string;
  data?: RecetaGeneradaData;
  error?: string;
  details?: string;
}

// =====================================================
// Tipos para Selección de Cupones
// =====================================================

export interface CuponSeleccionado {
  id_control: number;
  id_detalle: number;
  numero_resurtimiento: number;
  medicamento: MedicamentoInfo;
  prescripcion: PrescripcionInfo;
}
