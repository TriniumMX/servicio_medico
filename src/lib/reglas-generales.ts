// src/lib/reglas-generales.ts

import { db } from '@/db';
import { reglasGenerales } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Cache en memoria para las reglas generales
 * Se actualiza cada vez que se llama a obtenerReglasGenerales()
 */
let reglasCache: any = null;
let ultimaActualizacion: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * Obtiene las reglas generales del sistema
 *
 * @returns Objeto con todas las reglas activas
 */
export async function obtenerReglasGenerales() {
  const ahora = Date.now();

  // Si el cache es válido (menos de 5 minutos), retornarlo
  if (reglasCache && ahora - ultimaActualizacion < CACHE_TTL) {
    return reglasCache;
  }

  try {
    // Obtener la configuración activa de la BD
    const [reglas] = await db
      .select()
      .from(reglasGenerales)
      .where(eq(reglasGenerales.activo, true))
      .limit(1);

    if (!reglas) {
      console.warn('⚠️ No se encontraron reglas generales activas. Usando valores por defecto.');

      // Valores por defecto si no hay configuración
      return {
        vigencia_primer_surtimiento_dias: 3,
        vigencia_receta_dias: 30,
        ventana_tolerancia_resurtimiento_dias: 2,
        stock_minimo_alerta: 10,
        stock_critico_alerta: 5,
      };
    }

    // Actualizar cache
    reglasCache = reglas;
    ultimaActualizacion = ahora;

    console.log('✅ Reglas generales cargadas:', {
      vigencia_primer_surtimiento: reglas.vigencia_primer_surtimiento_dias,
      vigencia_receta: reglas.vigencia_receta_dias,
      ventana_tolerancia: reglas.ventana_tolerancia_resurtimiento_dias,
    });

    return reglas;
  } catch (error) {
    console.error('❌ Error al obtener reglas generales:', error);

    // Si hay error, retornar valores por defecto
    return {
      vigencia_primer_surtimiento_dias: 3,
      vigencia_receta_dias: 30,
      ventana_tolerancia_resurtimiento_dias: 2,
      stock_minimo_alerta: 10,
      stock_critico_alerta: 5,
    };
  }
}

/**
 * Invalida el cache de reglas generales
 * Usar cuando se actualicen las reglas en la BD
 */
export function invalidarCacheReglasGenerales() {
  reglasCache = null;
  ultimaActualizacion = 0;
  console.log('🔄 Cache de reglas generales invalidado');
}

/**
 * Obtiene solo la vigencia del primer surtimiento
 * @returns Número de días de vigencia
 */
export async function obtenerVigenciaPrimerSurtimiento(): Promise<number> {
  const reglas = await obtenerReglasGenerales();
  return reglas.vigencia_primer_surtimiento_dias || 3;
}

/**
 * Obtiene solo la ventana de tolerancia para resurtimientos
 * @returns Número de días de tolerancia (±X días)
 */
export async function obtenerVentanaToleranciaResurtimiento(): Promise<number> {
  const reglas = await obtenerReglasGenerales();
  return reglas.ventana_tolerancia_resurtimiento_dias || 2;
}
