// src/app/api/consultas/crear/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta, ESTATUS_CONSULTA } from '@/db/schema';
import { jwtVerify } from 'jose';
import { generarFolioConsulta } from '@/lib/generar-folio';
import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import { pusherServer } from '@/lib/pusher';

interface JwtPayload {
  id: number;
  usuario: string;
  tipoUsuario: number;
}

/**
 * Separa la presión arterial en sistólica y diastólica
 * Ejemplo: "120/80" → { sistolica: 120, diastolica: 80 }
 */
function separarPresionArterial(presionArterial: string): { sistolica: number | null; diastolica: number | null } {
  try {
    const partes = presionArterial.split('/');
    if (partes.length === 2) {
      const sistolica = parseInt(partes[0].trim(), 10);
      const diastolica = parseInt(partes[1].trim(), 10);

      if (!isNaN(sistolica) && !isNaN(diastolica)) {
        return { sistolica, diastolica };
      }
    }
  } catch (error) {
    console.error('Error al separar presión arterial:', error);
  }

  return { sistolica: null, diastolica: null };
}

/**
 * Calcula la edad detallada desde una fecha de nacimiento
 */
function calcularEdadDetallada(fechaNacimiento: Date): { años: number; meses: number; dias: number } {
  const hoy = new Date();

  let años = hoy.getFullYear() - fechaNacimiento.getFullYear();
  let meses = hoy.getMonth() - fechaNacimiento.getMonth();
  let dias = hoy.getDate() - fechaNacimiento.getDate();

  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  if (meses < 0) {
    años--;
    meses += 12;
  }

  return { años, meses, dias };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clavenomina,
      clavepaciente,
      nombrepaciente,
      departamento,
      edad,
      sexo,
      elpacienteesempleado,
      parentesco,
      sindicato,
      presionarterialpaciente, // Formato antiguo "120/80" (mantener por compatibilidad)
      ta_sistolica, // Nuevo formato - presión sistólica
      ta_diastolica, // Nuevo formato - presión diastólica
      temperaturapaciente,
      pulsosxminutopaciente,
      respiracionpaciente,
      estaturapaciente,
      pesopaciente,
      glucosapaciente,
      motivo_consulta,
      id_referencia_origen, // Nuevo campo para vincular con referencia
    } = body;

    // Validaciones básicas
    if (!clavenomina || !nombrepaciente) {
      return NextResponse.json(
        { success: false, error: 'Falta información del paciente (nómina y nombre requeridos)' },
        { status: 400 }
      );
    }

    // Validar que tengamos presión arterial (en cualquier formato)
    const tienePresionArterial = presionarterialpaciente || (ta_sistolica && ta_diastolica);

    if (!tienePresionArterial || !temperaturapaciente || !pulsosxminutopaciente) {
      return NextResponse.json(
        { success: false, error: 'Faltan signos vitales requeridos (presión arterial, temperatura y frecuencia cardíaca)' },
        { status: 400 }
      );
    }

    // ========================================
    // 1. Obtener usuario autenticado desde JWT
    // ========================================
    const token = request.cookies.get('token')?.value;
    let idMedico: number | null = null;
    let idUsuarioCrea: number | null = null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No se encontró token de autenticación' },
        { status: 401 }
      );
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret) as { payload: JwtPayload };
      idMedico = payload.id;
      idUsuarioCrea = payload.id;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // ========================================
    // 2. Obtener id_hospital del médico desde tabla usuarios
    // ========================================
    let idHospital: number | null = null;

    try {
      const usuarioResult = await executeQueryOne<{ id_hospital: number }>(`
        SELECT id_hospital FROM usuarios WHERE id_usuario = $1
      `, [idMedico]);

      if (usuarioResult && usuarioResult.id_hospital) {
        idHospital = usuarioResult.id_hospital;
      } else {
        console.warn(`⚠️ Usuario ${idMedico} no tiene id_hospital asignado`);
      }
    } catch (error) {
      console.error('Error al obtener id_hospital del usuario:', error);
    }

    // ========================================
    // 3. Determinar id_parentesco correcto
    // ========================================
    let idParentesco: number;

    if (elpacienteesempleado) {
      // Si es empleado, usar id_parentesco = 6 (EMPLEADO)
      idParentesco = 6;
    } else {
      // Si es beneficiario, buscar su parentesco en la tabla beneficiario
      if (!clavepaciente) {
        return NextResponse.json(
          { success: false, error: 'Falta el id del beneficiario (clavepaciente)' },
          { status: 400 }
        );
      }

      try {
        const beneficiarioResult = await executeQueryOne<{ parentesco: number }>(`
          SELECT parentesco FROM beneficiarios WHERE id_beneficiario = $1
        `, [clavepaciente]);

        if (!beneficiarioResult || !beneficiarioResult.parentesco) {
          return NextResponse.json(
            { success: false, error: 'No se encontró el parentesco del beneficiario' },
            { status: 404 }
          );
        }

        idParentesco = beneficiarioResult.parentesco;
      } catch (error) {
        console.error('Error al obtener parentesco del beneficiario:', error);
        return NextResponse.json(
          { success: false, error: 'Error al obtener datos del beneficiario' },
          { status: 500 }
        );
      }
    }

    // ========================================
    // 4. Calcular edad si es beneficiario
    // ========================================
    let edadEnAños: number | null = null;

    if (!elpacienteesempleado && clavepaciente) {
      try {
        const beneficiarioResult = await executeQuery<{ f_nacimiento: Date; sexo: string }>(`
          SELECT f_nacimiento, sexo FROM beneficiarios WHERE id_beneficiario = $1
        `, [clavepaciente]);

        if (beneficiarioResult.length > 0 && beneficiarioResult[0].f_nacimiento) {
          const f_nacimiento = new Date(beneficiarioResult[0].f_nacimiento);
          const edadDetallada = calcularEdadDetallada(f_nacimiento);
          edadEnAños = edadDetallada.años;
        }
      } catch (error) {
        console.error('Error al calcular edad del beneficiario:', error);
      }
    } else if (edad) {
      // Si es empleado y ya viene la edad
      edadEnAños = parseInt(edad, 10);
    }

    // ========================================
    // 5. Obtener presión arterial (priorizar valores separados)
    // ========================================
    let sistolica: number | null = null;
    let diastolica: number | null = null;

    // Priorizar valores separados si vienen directamente
    if (ta_sistolica && ta_diastolica) {
      sistolica = parseInt(ta_sistolica, 10);
      diastolica = parseInt(ta_diastolica, 10);
    } else if (presionarterialpaciente) {
      // Formato antiguo "120/80"
      const presion = separarPresionArterial(presionarterialpaciente);
      sistolica = presion.sistolica;
      diastolica = presion.diastolica;
    }

    // ========================================
    // 6. Generar folio único
    // ========================================
    const folio = await generarFolioConsulta();

    // ========================================
    // 7. Insertar consulta con Drizzle
    // ========================================
    const nuevaConsulta = await db.insert(consulta).values({
      // Folio y relación con padrón
      folio: folio,
      idBeneficiario: parseInt(clavepaciente) || 0,
      noNomina: clavenomina,
      idReferenciaOrigen: id_referencia_origen || undefined, // Vincular con referencia si existe

      // Snapshot del paciente
      nombre: nombrepaciente,
      edad: edadEnAños || undefined,
      sexo: sexo || undefined,
      idParentesco: idParentesco,
      departamento: departamento || undefined,
      sindicato: sindicato || undefined,
      esEmpleado: elpacienteesempleado || false,

      // Médico / hospital (obtenidos automáticamente)
      idMedico: idMedico!,
      idHospital: idHospital || undefined,

      // Motivo
      motivoConsulta: motivo_consulta || undefined,

      // 🫀 Signos vitales
      temperaturaC: temperaturapaciente ? temperaturapaciente.toString() : undefined,
      taSistolica: sistolica || undefined,
      taDiastolica: diastolica || undefined,
      frecuenciaCardiaca: pulsosxminutopaciente ? parseInt(pulsosxminutopaciente, 10) : undefined,
      oxigenacion: respiracionpaciente ? parseInt(respiracionpaciente, 10) : undefined,
      alturaCm: estaturapaciente ? estaturapaciente.toString() : undefined,
      pesoKg: pesopaciente ? pesopaciente.toString() : undefined,
      glucosaMgDl: glucosapaciente ? parseInt(glucosapaciente, 10) : undefined,

      // Estatus inicial: En espera (usando constante)
      estatusConsulta: ESTATUS_CONSULTA.EN_ESPERA,
      estatusActivo: true,

      // Auditoría
      idUsuarioCrea: idUsuarioCrea || undefined,
    }).returning({
      idConsulta: consulta.idConsulta,
      folio: consulta.folio,
    });

    // 🔔 Notificar al dashboard para actualizar contadores
    try {
      await pusherServer.trigger('dashboard', 'stats-refresh', {
        type: 'nueva_consulta',
        message: 'Nueva consulta generada'
      });
    } catch (error) {
      console.error('Error notificando a Pusher:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Consulta creada exitosamente',
      data: {
        id_consulta: Number(nuevaConsulta[0].idConsulta),
        folio: nuevaConsulta[0].folio,
      },
    });

  } catch (error: any) {
    console.error('❌ Error al crear consulta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear la consulta',
        details: error.message
      },
      { status: 500 }
    );
  }
}
