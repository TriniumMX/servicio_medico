// src/types/farmacia/medicamentos.ts

export type ClasificacionMedicamento = 'PATENTE' | 'GENERICO' | 'CONTROLADO';

export interface Medicamento {
  id_medicamento: number;
  nombre_comercial: string;
  sustancia_activa: string;
  clasificacion: ClasificacionMedicamento;
  id_medida: number;
  codigo_ean?: string | null;
  precio_unitario: string; // numeric en PostgreSQL retorna string
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  // Datos del JOIN con unidades_medida
  medida?: string;
  abreviatura?: string;
}

export interface MedicamentoForm {
  nombre_comercial: string;
  sustancia_activa: string;
  clasificacion: ClasificacionMedicamento;
  id_medida: number;
  codigo_ean?: string;
  precio_unitario: number;
}

export interface InventarioMedicamento {
  id_inventario: number;
  id_medicamento: number;
  existencia_actual: number;
  fondo_fijo: number;
  es_cuadro_basico: boolean;
  observaciones?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  // Datos del medicamento (JOIN)
  nombre_comercial?: string;
  sustancia_activa?: string;
  clasificacion?: ClasificacionMedicamento;
  precio_unitario?: string;
  activo?: boolean;
  medida?: string;
  abreviatura?: string;
}

export interface InventarioForm {
  existencia_actual?: number;
  cantidad_surtir?: number; // Nuevo campo para resurtimiento
  fondo_fijo: number;
  es_cuadro_basico: boolean;
  observaciones?: string;
}

export interface FiltrosInventario {
  busqueda?: string;
  cuadro_basico?: boolean;
  estado_fondo?: 'completo' | 'requiere_reposicion';
}

export interface MedicamentosResponse {
  success: boolean;
  data?: Medicamento[];
  error?: string;
}

export interface MedicamentoResponse {
  success: boolean;
  data?: Medicamento;
  error?: string;
}

export interface InventarioResponse {
  success: boolean;
  data?: InventarioMedicamento[];
  error?: string;
}

export interface InventarioItemResponse {
  success: boolean;
  data?: InventarioMedicamento;
  error?: string;
  message?: string;
}
