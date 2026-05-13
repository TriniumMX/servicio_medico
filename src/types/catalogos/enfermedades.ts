export interface KpiEnfermedad {
  id_kpi?: number;
  id_enfermedad?: number;
  nombre_indicador: string;
  activo?: boolean;
  // Eliminamos meta y unidad de aquí
}

export interface EnfermedadCronica {
  id_enfermedad: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  kpis: KpiEnfermedad[];
}