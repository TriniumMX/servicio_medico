// src/app/api/catalogos/usuarios_y_proveedores/types.ts

export interface TipoUsuario {
  clavetipousuario: number;
  tipousuario: string;
}

export interface Usuario {
  id_usuario: number;
  nombre: string;
  cedula_profesional: string | null;
  id_especialidad: number | null;
  id_hospital: number | null;
  telefono: string | null;
  celular: string | null;
  email: string | null;
  direccion: string | null;
  colonia: string | null;
  username: string;
  password: string;
  id_tipousuario: number;
  costo: number | null;
  activo: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date | null;
}

export interface UsuarioConTipo extends Usuario {
  tipousuario?: string;
  nombre_hospital?: string;
  especialidad?: string;
}

// DTO para crear un nuevo usuario
export interface CreateUsuarioDTO {
  nombre: string;
  cedula_profesional?: string;
  id_especialidad?: number;
  id_hospital?: number;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  colonia?: string;
  username: string;
  password: string;
  id_tipousuario: number;
  costo?: number;
  activo?: boolean;
}

// DTO para actualizar un usuario
export interface UpdateUsuarioDTO {
  nombre?: string;
  cedula_profesional?: string;
  id_especialidad?: number;
  id_hospital?: number;
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: string;
  colonia?: string;
  username?: string;
  password?: string;
  id_tipousuario?: number;
  costo?: number;
  activo?: boolean;
}

// Respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}