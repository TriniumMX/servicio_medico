// src/types/alertas-fondos.ts

// Estados de alerta basados en porcentaje del fondo fijo
export type EstadoAlerta = 'CRITICO' | 'BAJO' | 'MEDIO' | 'NORMAL';

// Correo configurado para recibir alertas
export interface CorreoAlerta {
  id_correo: number;
  correo: string;
  nombre_destinatario: string;
  activo: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

// Formulario para crear/editar correo
export interface CorreoAlertaForm {
  correo: string;
  nombre_destinatario: string;
  activo?: boolean;
}

// Medicamento con alerta de fondo bajo
export interface MedicamentoAlerta {
  id_inventario: number;
  id_medicamento: number;
  nombre_comercial: string;
  sustancia_activa: string;
  existencia_actual: number;
  fondo_fijo: number;
  faltante: number;
  porcentaje: number;
  estado: EstadoAlerta;
  clasificacion?: string;
  medida?: string;
}

// Reporte de alertas
export interface ReporteAlerta {
  fecha_generacion: Date | string;
  total_alertas: number;
  criticos: number;
  bajos: number;
  medios: number;
  medicamentos: MedicamentoAlerta[];
}

// Resumen de alertas para dashboard
export interface ResumenAlertas {
  total_medicamentos: number;
  total_alertas: number;
  criticos: number;
  bajos: number;
  medios: number;
  normales: number;
}

// Respuestas de la API
export interface CorreosAlertaResponse {
  success: boolean;
  data?: CorreoAlerta[];
  error?: string;
}

export interface CorreoAlertaResponse {
  success: boolean;
  data?: CorreoAlerta;
  message?: string;
  error?: string;
}

export interface MedicamentosAlertaResponse {
  success: boolean;
  data?: MedicamentoAlerta[];
  resumen?: ResumenAlertas;
  error?: string;
}

export interface EnviarAlertaResponse {
  success: boolean;
  message?: string;
  destinatarios?: number;
  error?: string;
}

export interface VerificarNivelesResponse {
  success: boolean;
  hayAlertas: boolean;
  resumen?: ResumenAlertas;
  medicamentos?: MedicamentoAlerta[];
  error?: string;
}

// Umbrales de alerta (porcentaje del fondo fijo)
export const UMBRALES_ALERTA = {
  CRITICO: 10,  // <= 10% del fondo fijo
  BAJO: 30,     // <= 30% del fondo fijo
  MEDIO: 50,    // <= 50% del fondo fijo
} as const;

// Utilidad para calcular el estado de alerta
export function calcularEstadoAlerta(existencia: number, fondoFijo: number): EstadoAlerta {
  if (fondoFijo <= 0) return 'NORMAL';

  const porcentaje = (existencia / fondoFijo) * 100;

  if (porcentaje <= UMBRALES_ALERTA.CRITICO) return 'CRITICO';
  if (porcentaje <= UMBRALES_ALERTA.BAJO) return 'BAJO';
  if (porcentaje <= UMBRALES_ALERTA.MEDIO) return 'MEDIO';

  return 'NORMAL';
}

// Utilidad para calcular el porcentaje
export function calcularPorcentaje(existencia: number, fondoFijo: number): number {
  if (fondoFijo <= 0) return 100;
  return Math.round((existencia / fondoFijo) * 100);
}

// Utilidad para calcular faltante
export function calcularFaltante(existencia: number, fondoFijo: number): number {
  return Math.max(0, fondoFijo - existencia);
}
