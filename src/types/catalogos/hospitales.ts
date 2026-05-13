// src/types/catalogos/hospitales.ts

export interface Hospital {
  id_hospital: number;
  nombre_hospital: string;
  direccion?: string;
  contacto?: string;
  encargado?: string;
  razon_social?: string;
  activo: boolean; // CORRECCIÓN: Cambiado de string a boolean
  fecha_creacion?: string;
  fecha_modificacion?: string;
    latitud?: number;  // Nuevo
  longitud?: number; // Nuevo
}

export interface HospitalesResponse {
  success: boolean;
  data?: Hospital[];
  error?: string;
}