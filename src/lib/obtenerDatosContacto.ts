// src/lib/obtenerDatosContacto.ts

import { executeQueryOne } from '@/lib/dbPostgres';

interface DatosContacto {
  telefono: string | null;
  correo: string | null;
}

/**
 * Obtiene los datos de contacto (teléfono y correo) de un paciente
 * @param idConsulta ID de la consulta
 * @returns Objeto con teléfono y correo del paciente
 */
export async function obtenerDatosContactoPaciente(idConsulta: number): Promise<DatosContacto> {
  try {
    // Obtener datos de la consulta para saber si es empleado o beneficiario
    const consulta = await executeQueryOne<{
      es_empleado: boolean;
      no_nomina: string;
      id_beneficiario: number | null;
    }>(`
      SELECT es_empleado, no_nomina, id_beneficiario
      FROM consulta
      WHERE id_consulta = $1
    `, [idConsulta]);

    if (!consulta) {
      throw new Error('Consulta no encontrada');
    }

    if (consulta.es_empleado) {
      // Es empleado: obtener datos del web service
      return await obtenerDatosContactoEmpleado(consulta.no_nomina);
    } else {
      // Es beneficiario: obtener datos de la tabla beneficiarios
      if (!consulta.id_beneficiario) {
        throw new Error('ID de beneficiario no encontrado');
      }
      return await obtenerDatosContactoBeneficiario(consulta.id_beneficiario);
    }
  } catch (error) {
    console.error('Error al obtener datos de contacto:', error);
    return { telefono: null, correo: null };
  }
}

/**
 * Obtiene los datos de contacto de un empleado desde el web service
 * @param noNomina Número de nómina del empleado
 * @returns Objeto con teléfono y correo del empleado
 */
async function obtenerDatosContactoEmpleado(noNomina: string): Promise<DatosContacto> {
  try {
    const port = process.env.PORT || '3000';
    const baseUrl = `http://localhost:${port}`;
    const response = await fetch(`${baseUrl}/api/webService/empleado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ num_nom: noNomina }),
    });

    if (!response.ok) {
      throw new Error('Error al obtener datos del empleado');
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Empleado no encontrado');
    }

    return {
      telefono: data.data.telefono || null,
      correo: data.data.correo || null,
    };
  } catch (error) {
    console.error('Error al obtener datos de empleado desde WS:', error);
    return { telefono: null, correo: null };
  }
}

/**
 * Obtiene los datos de contacto de un beneficiario desde la base de datos
 * @param idBeneficiario ID del beneficiario
 * @returns Objeto con teléfono y correo del beneficiario
 */
async function obtenerDatosContactoBeneficiario(idBeneficiario: number): Promise<DatosContacto> {
  try {
    const beneficiario = await executeQueryOne<{
      telefono: string | null;
      correo: string | null;
    }>(`
      SELECT telefono, correo
      FROM beneficiarios
      WHERE id_beneficiario = $1
    `, [idBeneficiario]);

    if (!beneficiario) {
      throw new Error('Beneficiario no encontrado');
    }

    return {
      telefono: beneficiario.telefono || null,
      correo: beneficiario.correo || null,
    };
  } catch (error) {
    console.error('Error al obtener datos de beneficiario:', error);
    return { telefono: null, correo: null };
  }
}

/**
 * Obtiene los datos de contacto por número de nómina y/o ID de beneficiario
 * Útil cuando ya se tienen estos datos sin necesidad de consultar la tabla de consultas
 */
export async function obtenerDatosContactoDirecto(
  esEmpleado: boolean,
  noNomina?: string,
  idBeneficiario?: number
): Promise<DatosContacto> {
  if (esEmpleado && noNomina) {
    return await obtenerDatosContactoEmpleado(noNomina);
  } else if (!esEmpleado && idBeneficiario) {
    return await obtenerDatosContactoBeneficiario(idBeneficiario);
  }

  return { telefono: null, correo: null };
}
