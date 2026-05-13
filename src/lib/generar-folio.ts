// src/lib/generar-folio.ts
import { db } from '@/db';
import { consulta } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Genera un folio único para una consulta
 * Formato: 8 caracteres alfanuméricos aleatorios (A-Z, 0-9)
 * Ejemplo: A7K9M2F8
 *
 * Genera caracteres aleatorios y verifica que no existan en la base de datos
 * para garantizar unicidad.
 */
export async function generarFolioConsulta(): Promise<string> {
  const MAX_INTENTOS = 10; // Máximo de intentos para evitar loops infinitos

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const folioGenerado = generarCaracteresAleatorios(8);

    // Verificar si el folio ya existe en la base de datos
    const folioExistente = await db
      .select({ folio: consulta.folio })
      .from(consulta)
      .where(eq(consulta.folio, folioGenerado))
      .limit(1);

    // Si no existe, retornar el folio único
    if (folioExistente.length === 0) {
      return folioGenerado;
    }
  }

  // Si después de MAX_INTENTOS no se genera un folio único, agregar timestamp
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
  return generarCaracteresAleatorios(6) + timestamp;
}

/**
 * Genera una cadena de caracteres alfanuméricos aleatorios
 * Usa solo MAYÚSCULAS (A-Z) y números (0-9) para evitar confusión
 * Excluye caracteres ambiguos: 0, O, I, 1 para mejor legibilidad
 */
function generarCaracteresAleatorios(longitud: number): string {
  // Alfabeto sin caracteres ambiguos (sin 0, O, I, 1)
  const caracteres = '234567892ABCDEFGHJKLMNPQRSTUVWXYZ';
  let resultado = '';

  // Usar crypto para generar números aleatorios seguros
  const array = new Uint8Array(longitud);
  crypto.getRandomValues(array);

  for (let i = 0; i < longitud; i++) {
    // Usar módulo para obtener un índice válido
    const indice = array[i] % caracteres.length;
    resultado += caracteres[indice];
  }

  return resultado;
}

/**
 * Valida el formato de un folio
 * Formato: 8 caracteres alfanuméricos (A-Z, 2-9)
 */
export function validarFormatoFolio(folio: string): boolean {
  const regex = /^[2-9A-Z]{8}$/;
  return regex.test(folio);
}
