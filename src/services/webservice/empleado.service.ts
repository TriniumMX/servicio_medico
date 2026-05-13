// src/services/webservice/empleado.service.ts

export interface EmpleadoWS {
  a_materno: string;
  a_paterno: string;
  activo: string;
  calle: string;
  cod_postal: string;
  colonia: string;
  correo: string;
  cuotaSindical: string;
  curp: string;
  departamento: string;
  estado: string;
  estado_civil: string;
  fecha_alta: string;
  fecha_baja: string;
  fecha_nacimiento: string;
  grupoNomina: string;
  id_empleado: number;
  municipio: string;
  nombre: string;
  num_nom: string;
  puesto: string;
  rfc: string;
  scolaridad: string;
  sexo: string;
  telefono: string;
  tipo_sangre: string;
  un_med_fam: string;
}

export interface EmpleadoWSResponse {
  success: boolean;
  empleado?: EmpleadoWS;
  error?: string;
}

/**
 * Service para manejar las llamadas al Web Service de empleados
 */
export class EmpleadoWSService {
  /**
   * Obtiene los datos de un empleado por su número de nómina
   */
  static async obtenerEmpleadoPorNomina(num_nom: string): Promise<EmpleadoWSResponse> {
    try {
      const response = await fetch('/api/webService/empleado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ num_nom }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Error al obtener datos del empleado',
        };
      }

      const empleado: EmpleadoWS = await response.json();

      return {
        success: true,
        empleado,
      };
    } catch (error) {
      console.error('Error al consumir web service de empleado:', error);
      return {
        success: false,
        error: 'Error al conectar con el servidor',
      };
    }
  }

  /**
   * Obtiene el sindicato (cuota sindical) de un empleado
   */
  static async obtenerSindicato(num_nom: string): Promise<string | null> {
    const response = await this.obtenerEmpleadoPorNomina(num_nom);

    if (response.success && response.empleado) {
      return response.empleado.cuotaSindical || null;
    }

    return null;
  }

  /**
   * Obtiene el nombre completo del empleado
   */
  static obtenerNombreCompleto(empleado: EmpleadoWS): string {
    return `${empleado.nombre} ${empleado.a_paterno} ${empleado.a_materno}`.trim();
  }

  /**
   * Formatea la fecha del web service a formato ISO
   */
  static formatearFecha(fechaWS: string): string | null {
    try {
      // Formato: "28/10/2024 12:00:00 a. m."
      const match = fechaWS.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        const [, dia, mes, anio] = match;
        return `${anio}-${mes}-${dia}`;
      }
      return null;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return null;
    }
  }

  /**
   * Calcula la edad del empleado
   */
  static calcularEdad(fecha_nacimiento: string): number {
    const fechaNac = this.formatearFecha(fecha_nacimiento);
    if (!fechaNac) return 0;

    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }
}
