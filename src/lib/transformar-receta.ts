// src/lib/transformar-receta.ts

/**
 * Tipo: Estructura ANIDADA (la que retorna el API y usa RecetaImprimible)
 */
export interface RecetaAnidada {
  folio_receta: string;
  folio_consulta: string;
  fecha_emision: string;
  paciente: {
    nombre: string;
    edad?: number;
    no_nomina: string;
    departamento?: string;
    es_empleado: boolean;
  };
  medico: {
    nombre: string;
    cedula?: string;
  };
  medicamentos: Array<{
    nombre_comercial: string;
    sustancia_activa: string;
    dosis: string;
    duracion_tratamiento_dias: number;
    cantidad_total: number;
    indicaciones?: string;
    realizar_resurtimiento: boolean;
    meses_resurtimiento?: number;
  }>;
  diagnostico?: {
    codigo: string;
    titulo: string;
  };
}

/**
 * Tipo: Estructura PLANA (la que usa generarRecetaPDF)
 */
export interface RecetaPlana {
  consulta?: string;
  folio_consulta?: string;
  fecha_nac?: string;
  nomina?: string;
  sindicato?: string;
  secretaria?: string;
  parentesco?: string;
  nombre_paciente?: string;
  edad?: string;
  ta?: string;
  temperatura?: string;
  fc?: string;
  oxigenacion?: string;
  altura?: string;
  peso?: string;
  glucosa?: string;
  diagnostico?: string;
  medicamentos?: Array<{
    nombre: string;
    indicaciones: string;
    tratamiento: string;
    piezas: string | number;
  }>;
  incapacidad?: string;
  incapacidad_inicio?: string;
  incapacidad_fin?: string;
  especialidad?: string;
  nombre_medico?: string;
  firma_medico?: string;
}

/**
 * Transforma de estructura ANIDADA a PLANA (para generar PDF)
 */
export function transformarRecetaParaPDF(recetaAnidada: RecetaAnidada): RecetaPlana {
  return {
    // Fecha de consulta (extraída de fecha_emision)
    consulta: recetaAnidada.fecha_emision.split('T')[0],

    // Folio
    folio_consulta: recetaAnidada.folio_consulta,

    // Datos del paciente (de objeto anidado a campos planos)
    nombre_paciente: recetaAnidada.paciente.nombre,
    edad: recetaAnidada.paciente.edad ? `${recetaAnidada.paciente.edad} años` : '',
    nomina: recetaAnidada.paciente.no_nomina,
    secretaria: recetaAnidada.paciente.departamento || '',

    // Diagnóstico (de objeto anidado a string plano)
    diagnostico: recetaAnidada.diagnostico
      ? `${recetaAnidada.diagnostico.codigo} - ${recetaAnidada.diagnostico.titulo}`
      : '',

    // Medicamentos (transformar estructura)
    medicamentos: recetaAnidada.medicamentos.map((med) => ({
      nombre: `${med.nombre_comercial} (${med.sustancia_activa})`,
      indicaciones: med.dosis,
      tratamiento: `${med.duracion_tratamiento_dias} días`,
      piezas: med.cantidad_total,
    })),

    // Médico (de objeto anidado a campo plano)
    nombre_medico: recetaAnidada.medico.nombre,
    firma_medico: recetaAnidada.medico.nombre,

    // Campos opcionales vacíos (no disponibles en la estructura anidada)
    fecha_nac: '',
    sindicato: '',
    parentesco: '',
    ta: '',
    temperatura: '',
    fc: '',
    oxigenacion: '',
    altura: '',
    peso: '',
    glucosa: '',
    incapacidad: '',
    incapacidad_inicio: '',
    incapacidad_fin: '',
    especialidad: 'Medicina General',
  };
}

/**
 * Transforma de estructura PLANA a ANIDADA (si es necesario)
 */
export function transformarRecetaDesdeAPI(recetaPlana: RecetaPlana): RecetaAnidada {
  // Esta función es para el caso inverso, si lo necesitas
  throw new Error('Not implemented - use API endpoint directly for nested structure');
}
