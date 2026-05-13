// src/types/catalogos/especialidades.ts

/**
 * Modelo de Especialidad desde la base de datos
 */
export interface Especialidad {
  claveespecialidad: number;
  especialidad: string;
  especial: 'S' | 'N';
  estatus: boolean;
}

/**
 * DTO para crear nueva especialidad
 */
export interface CreateEspecialidadDTO {
  especialidad: string;
  especial: 'S' | 'N';
  estatus: boolean;
}

/**
 * DTO para actualizar especialidad existente
 */
export interface UpdateEspecialidadDTO {
  especialidad?: string;
  especial?: 'S' | 'N';
  estatus?: boolean;
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}