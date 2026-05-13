import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/dbPostgres';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const specialtyId = searchParams.get('specialtyId');

        // Date Filter
        const dateFilter = startDate && endDate
            ? `AND c.fecha_consulta >= '${startDate}' AND c.fecha_consulta <= '${endDate} 23:59:59'`
            : ``; // Default: All time or let frontend handle defaults? keeping empty for all time if not specified

        // Specialty Filter (only applies to specialists query)
        const specialtyFilter = specialtyId
            ? `AND u.id_especialidad = ${specialtyId}`
            : ``;

        // --- 1. Query for General Doctors ---
        // Aggregated into a single "Total" or grouped by Doctor if the list is small?
        // User said: "show me only the number of general consultations"
        // We will output a single row for "Médicos Generales" to keep it simple as requested.
        const generalesQuery = `
            SELECT 
                'Médicos Generales' as name,
                COUNT(c.id_consulta) as value,
                COALESCE(SUM(CAST(u.costo AS NUMERIC)), 0) as total_ingreso
            FROM consulta c
            JOIN usuarios u ON c.id_medico = u.id_usuario
            JOIN tiposusuarios t ON u.id_tipousuario = t.clavetipousuario
            WHERE c.estatus_activo = true
            AND t.tipousuario ILIKE '%general%'
            ${dateFilter}
            GROUP BY name
        `;

        // --- 2. Query for Specialists ---
        // Grouped by Specialty (e.g., Ginecología, Pediatría)
        // This solves "too many doctors" issue.
        const especialistasQuery = `
            SELECT 
                COALESCE(e.especialidad, 'Sin Especialidad') as name,
                COUNT(c.id_consulta) as value,
                COALESCE(SUM(CAST(u.costo AS NUMERIC)), 0) as total_ingreso
            FROM consulta c
            JOIN usuarios u ON c.id_medico = u.id_usuario
            JOIN tiposusuarios t ON u.id_tipousuario = t.clavetipousuario
            LEFT JOIN especialidades e ON u.id_especialidad = e.claveespecialidad
            WHERE c.estatus_activo = true
            AND t.tipousuario ILIKE '%especialista%'
            ${dateFilter}
            ${specialtyFilter}
            GROUP BY e.especialidad
            ORDER BY value DESC
        `;

        const [generalesRows, especialistasRows] = await Promise.all([
            executeQuery(generalesQuery),
            executeQuery(especialistasQuery)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                generales: generalesRows.map((row: any) => ({
                    name: row.name,
                    value: Number(row.value),
                    ingreso: Number(row.total_ingreso)
                })),
                especialistas: especialistasRows.map((row: any) => ({
                    name: row.name,
                    value: Number(row.value),
                    ingreso: Number(row.total_ingreso)
                }))
            }
        });

    } catch (error) {
        console.error('Error Productivity Analytics:', error);
        return NextResponse.json({
            success: false,
            error: 'Error obteniendo productividad',
            details: error
        }, { status: 500 });
    }
}
