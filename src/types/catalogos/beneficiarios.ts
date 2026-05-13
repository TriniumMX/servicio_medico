// src/types/catalogos/beneficiarios.ts

export interface Beneficiario {
  ID_BENEFICIARIO: number;
  NO_NOMINA: string;
  PARENTESCO: number;
  PARENTESCO_NOMBRE?: string; // Del JOIN con la tabla PARENTESCO
  PARENTESCO_DESC?: string; // Alias del JOIN con PARENTESCO
  NOMBRE: string;
  A_PATERNO: string;
  A_MATERNO: string;
  SEXO: string;
  ESCOLARIDAD?: string;
  F_NACIMIENTO: string;
  ACTIVO: string;
  ALERGIAS?: string;
  SANGRE?: string;
  TEL_EMERGENCIA?: string;
  NOMBRE_EMERGENCIA?: string;
  TELEFONO?: string;
  CORREO?: string;
  ESDISCAPACITADO?: boolean;
  ESESTUDIANTE?: boolean;
  VIGENCIA_ESTUDIOS?: string;
  FOTO_URL?: string;
  CURP?: string;
  URL_CONSTANCIA?: string;
  URL_CURP?: string;
  URL_ACTA_NAC?: string;
  URL_INE?: string;
  URL_CONCUBINATO?: string;
  URL_ACTAMATRIMONIO?: string;
  URL_NOISSTE?: string;
  URL_INCAP?: string;
  DESCRIPTOR_FACIAL?: string;
  FIRMA?: string;
  MOTIVO?: string;
  URL_ACTADEPENDENCIAECONOMICA?: string;
}

export interface BeneficiariosResponse {
  success: boolean;
  data?: Beneficiario[];
  error?: string;
}