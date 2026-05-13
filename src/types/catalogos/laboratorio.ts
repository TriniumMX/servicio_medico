export interface EstudioLaboratorio {
  id_estudio: number;
  nombre_estudio: string;
  categoria?: string;
  costo: number;
  activo: boolean;
  id_hospital: number;
  nombre_hospital?: string;
}

export interface Hospital {
  id_hospital: number;
  nombre_hospital: string;
}

export interface LaboratorioResponse {
  success: boolean;
  data?: EstudioLaboratorio[];
  error?: string;
}