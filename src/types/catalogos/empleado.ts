// src/types/catalogos/empleado.ts

export interface Empleado {
  num_nom: string;
  nombre?: string;
  puesto?: string;
  departamento?: string;
  fecha_baja?: string;
  fecha_ingreso?: string;
  [key: string]: any; // Para capturar TODOS los campos del WS
}

export interface EmpleadoResponse {
  success: boolean;
  data?: Empleado;
  error?: string;
}