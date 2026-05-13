// src/types/farmacia/unidades-medida.ts

export interface UnidadMedida {
  id_medida: number;
  medida: string;
  abreviatura: string;
}

export interface UnidadMedidaForm {
  medida: string;
  abreviatura: string;
}

export interface UnidadesMedidaResponse {
  success: boolean;
  data?: UnidadMedida[];
  error?: string;
}

export interface UnidadMedidaResponse {
  success: boolean;
  data?: UnidadMedida;
  error?: string;
}
