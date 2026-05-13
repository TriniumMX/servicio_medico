// src/types/farmacia/surtimiento.ts

// =====================================================
// Tipos para API de Búsqueda de Recetas
// =====================================================

export interface RecetaBusqueda {
  id_receta: number;
  folio_receta: string;
  codigo_barras: string;
  fecha_emision: string;
  vigencia_dias: number;
  observaciones_generales: string | null;
  // Campos de cancelación
  cancelado: boolean;
  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  usuario_cancelo: { nombre: string; username: string } | null;
}

export interface PacienteReceta {
  nomina: string;
  nombre: string;
  ape_pat: string;
  ape_mat: string;
  nombre_completo: string;
}

export interface ConsultaReceta {
  folio: string;
  diagnostico: string;
  fecha_consulta: string;
}

export interface MedicamentoInfo {
  id_medicamento: number;
  nombre_comercial: string;
  sustancia_activa: string;
  clasificacion: string;
  codigo_ean: string | null;
}

export interface PrescripcionInfo {
  cantidad_total: number;
  dosis: string;
  duracion_tratamiento_dias: number;
  via_administracion: string;
  indicaciones: string | null;
}

export interface CuponResurtimiento {
  id_control: number;
  numero_resurtimiento: number;
  estatus: 'pendiente' | 'surtido' | 'vencido' | 'cancelado';
  fecha_programada: string;
  fecha_surtido?: string;
}

export interface ResurtimientoInfo {
  realizar_resurtimiento: boolean;
  meses_resurtimiento: number | null;
  cupones: CuponResurtimiento[];
}

export interface SurtimientoHistorial {
  id_surtimiento: number;
  cantidad_surtida: number;
  fecha_surtimiento: string;
  observaciones: string | null;
}

export interface SurtimientosInfo {
  total_surtido: number;
  pendiente_surtir: number;
  completado: boolean;
  historial: SurtimientoHistorial[];
}

export interface MedicamentoReceta {
  id_detalle: number;
  medicamento: MedicamentoInfo;
  prescripcion: PrescripcionInfo;
  resurtimiento: ResurtimientoInfo;
  surtimientos: SurtimientosInfo;
}

export interface ResumenReceta {
  total_medicamentos: number;
  medicamentos_completados: number;
  medicamentos_pendientes: number;
  receta_completada: boolean;
}

export interface ValidacionVigencia {
  dias_vigencia_primer_surtimiento: number;
  dias_transcurridos: number;
  dias_restantes: number;
  vencida_primer_surtimiento: boolean;
  puede_marcar_como_cero: boolean;
}

export interface RecetaCompleta {
  receta: RecetaBusqueda;
  paciente: PacienteReceta;
  consulta: ConsultaReceta;
  medicamentos: MedicamentoReceta[];
  resumen: ResumenReceta;
  validacion_vigencia?: ValidacionVigencia;
}

export interface BuscarRecetaResponse {
  success: boolean;
  data?: RecetaCompleta;
  error?: string;
  folio_buscado?: string;
}

// =====================================================
// Tipos para API de Búsqueda por EAN
// =====================================================

export interface MedicamentoEAN {
  id_medicamento: number;
  nombre_comercial: string;
  sustancia_activa: string;
  clasificacion: string;
  codigo_ean: string | null;
  precio_unitario: string;
}

export interface InventarioMedicamento {
  id_inventario: number;
  existencia_actual: number;
  fondo_fijo: number;
  es_cuadro_basico: boolean;
}

export interface AlertasStock {
  sin_stock: boolean;
  stock_bajo: boolean;
  stock_critico: boolean;
  requiere_reposicion?: boolean;
  mensaje: string;
}

export interface MedicamentoEANData {
  medicamento: MedicamentoEAN;
  inventario: InventarioMedicamento;
  alertas: AlertasStock;
}

export interface BuscarEANResponse {
  success: boolean;
  data?: MedicamentoEANData;
  error?: string;
  ean_buscado?: string;
}

// =====================================================
// Tipos para API de Surtimiento
// =====================================================

export interface SurtimientoRequest {
  id_detalle: number;
  cantidad_surtida: number;
  id_farmaceutico?: number;
  observaciones?: string;
  id_control?: number;
}

export interface SurtimientoRegistrado {
  id_surtimiento: number;
  id_detalle: number;
  cantidad_surtida: number;
  fecha_surtimiento: string;
  id_farmaceutico: number | null;
  observaciones: string | null;
}

export interface ResumenSurtimiento {
  cantidad_total: number;
  total_surtido: number;
  pendiente_surtir: number;
  completado: boolean;
  cupones_pendientes: number;
}

export interface InventarioActualizado {
  stock_anterior: number;
  cantidad_descontada: number;
  stock_actual: number;
  alertas: {
    stock_bajo: boolean;
    stock_critico: boolean;
    mensaje: string;
  };
}

export interface SurtimientoResponse {
  success: boolean;
  message?: string;
  data?: {
    surtimiento: SurtimientoRegistrado;
    cupon_surtido: CuponResurtimiento | null;
    resumen: ResumenSurtimiento;
    inventario: InventarioActualizado;
  };
  error?: string;
  disponible?: number;
  stock_disponible?: number;
  stock_solicitado?: number;
}

// =====================================================
// Tipos para el Estado del Componente
// =====================================================

export interface EstadoSurtimiento {
  recetaCargada: boolean;
  recetaData: RecetaCompleta | null;
  medicamentoActual: MedicamentoReceta | null;
  eanEscaneado: string | null;
  cantidadASurtir: number;
  cargando: boolean;
  error: string | null;
  exito: string | null;
}
