import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { consulta, diagnosticosConsulta, recetas, detalleReceta, referenciasEspecialidad, medicamentos } from '@/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const idBeneficiario = parseInt(id);

        if (isNaN(idBeneficiario)) {
            return NextResponse.json(
                { success: false, error: 'ID de beneficiario inválido' },
                { status: 400 }
            );
        }

        // 1. Obtener todas las consultas
        const consultas = await db
            .select()
            .from(consulta)
            .where(eq(consulta.idBeneficiario, idBeneficiario))
            .orderBy(desc(consulta.fechaConsulta));

        if (consultas.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const consultaIds = consultas.map((c) => c.idConsulta);

        // 2. Obtener Diagnósticos
        const diagnosticos = await db
            .select()
            .from(diagnosticosConsulta)
            .where(inArray(diagnosticosConsulta.idConsulta, consultaIds))
            .orderBy(diagnosticosConsulta.orden);

        // 3. Obtener Recetas y Detalles
        const recetasList = await db
            .select()
            .from(recetas)
            .where(inArray(recetas.id_consulta, consultaIds));

        const recetaIds = recetasList.map(r => r.id_receta);

        let detallesRecetaList: any[] = [];
        if (recetaIds.length > 0) {
            detallesRecetaList = await db
                .select({
                    id_receta: detalleReceta.id_receta,
                    cantidad: detalleReceta.cantidad_total,
                    dosis: detalleReceta.dosis,
                    duracion: detalleReceta.duracion_tratamiento_dias,
                    indicaciones: detalleReceta.indicaciones,
                    nombreMedicamento: medicamentos.nombre_comercial,
                    presentacion: medicamentos.sustancia_activa
                })
                .from(detalleReceta)
                .leftJoin(medicamentos, eq(detalleReceta.id_medicamento, medicamentos.id_medicamento))
                .where(inArray(detalleReceta.id_receta, recetaIds));
        }

        // 4. Obtener Referencias
        const referenciasList = await db
            .select()
            .from(referenciasEspecialidad)
            .where(inArray(referenciasEspecialidad.idConsultaOrigen, consultaIds));

        // 5. Obtener Incapacidades (Raw SQL)
        let incapacidadesList: any[] = [];
        if (consultaIds.length > 0) {
            const idsString = consultaIds.join(',');
            if (/^[\d,]+$/.test(idsString)) {
                const queryIncapacidades = sql.raw(`
                SELECT id_incapacidad, id_consulta, fecha_inicio, fecha_fin, dias_sugeridos, estatus, dias_autorizados
                FROM incapacidades
                WHERE id_consulta IN (${idsString})
            `);
                const resIncapacidades = await db.execute(queryIncapacidades);
                incapacidadesList = resIncapacidades.rows;
            }
        }

        // 6. Obtener Estudios de Laboratorio (Raw SQL)
        let estudiosLabList: any[] = [];
        if (consultaIds.length > 0) {
            const idsString = consultaIds.join(',');
            if (/^[\d,]+$/.test(idsString)) {
                const queryEstudios = sql.raw(`
                    SELECT
                        ce.id_solicitud,
                        ce.id_consulta,
                        ce.motivo AS motivo_clinico,
                        ce.fecha_solicitud,
                        ce.estatus,
                        ce.fecha_autorizacion,
                        ce.motivo_rechazo,
                        ce.fecha_entrega,
                        el.nombre_estudio,
                        el.categoria,
                        el.costo
                    FROM consulta_estudios ce
                    INNER JOIN cat_estudios_laboratorio el ON ce.id_estudio = el.id_estudio
                    WHERE ce.id_consulta IN (${idsString})
                    ORDER BY ce.fecha_solicitud DESC
                `);
                const resEstudios = await db.execute(queryEstudios);
                estudiosLabList = resEstudios.rows;
            }
        }

        // 7. Armar el historial completo
        const historial = consultas.map((c) => {
            const diags = diagnosticos.filter((d) => d.idConsulta === c.idConsulta);

            const recetasConsulta = recetasList.filter((r) => r.id_consulta === c.idConsulta);
            const recetasIdsConsulta = recetasConsulta.map(r => r.id_receta);
            const meds = detallesRecetaList.filter((d) => recetasIdsConsulta.includes(d.id_receta));

            const refs = referenciasList.filter((ref) => ref.idConsultaOrigen === c.idConsulta);
            const incaps = incapacidadesList.filter((i: any) => i.id_consulta === c.idConsulta);
            const estudios = estudiosLabList.filter((e: any) => e.id_consulta === c.idConsulta);

            return {
                ...c,
                diagnosticos: diags,
                medicamentos: meds,
                recetasInfo: recetasConsulta,
                referencias: refs,
                incapacidades: incaps,
                estudiosLaboratorio: estudios,
                tieneReceta: meds.length > 0,
                tieneIncapacidad: incaps.length > 0,
                tieneLaboratorio: estudios.length > 0,
                tieneReferencia: refs.length > 0
            };
        });

        return NextResponse.json({
            success: true,
            data: historial,
        });

    } catch (error: any) {
        console.error('Error obteniendo historial:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno al obtener el historial' },
            { status: 500 }
        );
    }
}
