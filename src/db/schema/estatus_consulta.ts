// La tabla estatus_consulta fue eliminada en SaaS v1.
// estatus_consulta ahora es un SMALLINT con CHECK constraint en la tabla consulta.
// Las constantes se mantienen aquí para compatibilidad con código que aún las importe.

export const ESTATUS_CONSULTA = {
  CANCELADA: 0,
  EN_ESPERA:  1,
  FINALIZADA: 2,
} as const;

export type EstatusConsultaValue = typeof ESTATUS_CONSULTA[keyof typeof ESTATUS_CONSULTA];
