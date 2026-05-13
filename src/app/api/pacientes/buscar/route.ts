import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta } from '@/db/schema';
import { ilike, or, eq, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');

        if (!q || q.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Buscamos en la tabla de consultas para encontrar pacientes (beneficiarios) únicos.
        // Usamos el campo id_beneficiario para agrupar.
        // Obtenemos los datos de la consulta más reciente de ese beneficiario.

        // NOTA: Drizzle ORM con PostgreSQL 'distinctOn' es la forma eficiente de hacer esto.
        const pacientes = await db
            .select({
                idBeneficiario: consulta.idBeneficiario,
                nombre: consulta.nombre,
                noNomina: consulta.noNomina,
                departamento: consulta.departamento,
                edad: consulta.edad,
                sexo: consulta.sexo,
                ultimaConsulta: consulta.fechaConsulta,
                totalConsultas: sql<number>`count(*) over (partition by ${consulta.idBeneficiario})`,
            })
            .from(consulta)
            .where(
                or(
                    ilike(consulta.nombre, `%${q}%`),
                    ilike(consulta.noNomina, `%${q}%`),
                    ilike(consulta.folio, `%${q}%`)
                )
            )
            .orderBy(desc(consulta.fechaConsulta)) // Ordenar por fecha para tener el más reciente primero si no usáramos distinct (pero distinct requiere order by coincidente)
        // .distinctOn(consulta.idBeneficiario); // Drizzle support for distinctOn might vary or need specific syntax per driver, generally straightforward in Postgres.

        // Post-procesamiento manual para 'distinct' por idBeneficiario si distinctOn da problemas o para asegurar el último exacto.
        // Dado que distinctOn requiere que el ORDER BY empiece con la columna distinct, y queremos ordenar por relevancia...
        // Estrategia simple: traer coincidencias (limitadas) y filtrar únicos en memoria (si no son demasiados) o usar query builder avanzado.
        // Para simplificar y asegurar performance, haremos un subquery o simplemente filtramos en JS dado que es un buscador autocomplete.

        // Mejor enfoque con Drizzle + Postgres:
        /*
          SELECT DISTINCT ON (id_beneficiario) * 
          FROM consulta 
          WHERE ... 
          ORDER BY id_beneficiario, fecha_consulta DESC
        */

        // Sin embargo, queremos buscar por nombre. Si ordenamos por id_beneficiario perdemos el orden de "relevancia" o fecha global.
        // Vamos a traer los últimos 50 registros que coincidan y deduplicar en memoria.

        const busqueda = await db.query.consulta.findMany({
            where: or(
                ilike(consulta.nombre, `%${q}%`),
                ilike(consulta.noNomina, `%${q}%`),
                ilike(consulta.folio, `%${q}%`)
            ),
            orderBy: [desc(consulta.fechaConsulta)],
            limit: 50,
            columns: {
                idBeneficiario: true,
                nombre: true,
                noNomina: true,
                departamento: true,
                edad: true,
                sexo: true,
                fechaConsulta: true,
            }
        });

        // Deduplicar por idBeneficiario mantienendo el primero (que es el más reciente por el orderBy)
        const unicosMap = new Map();
        busqueda.forEach(p => {
            if (!unicosMap.has(p.idBeneficiario)) {
                unicosMap.set(p.idBeneficiario, {
                    idBeneficiario: p.idBeneficiario,
                    nombre: p.nombre,
                    noNomina: p.noNomina,
                    departamento: p.departamento,
                    edad: p.edad,
                    sexo: p.sexo,
                    ultimaConsulta: p.fechaConsulta
                });
            }
        });

        const resultados = Array.from(unicosMap.values());

        return NextResponse.json({
            success: true,
            data: resultados,
        });

    } catch (error: any) {
        console.error('Error al buscar pacientes:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno al buscar pacientes' },
            { status: 500 }
        );
    }
}
