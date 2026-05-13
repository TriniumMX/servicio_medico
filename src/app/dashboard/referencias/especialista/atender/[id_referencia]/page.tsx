'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { ReferenciaEspecialidad } from '@/types/referencias';

export default function AtenderReferenciaPage() {
    const params = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const idReferencia = params.id_referencia as string;
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const iniciarAtencion = async () => {
            try {
                // 1. Obtener detalles de la referencia
                const response = await fetch(`/api/referencias/especialista/detalle/${idReferencia}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.error || 'Error al cargar la referencia');
                }

                const referencia: ReferenciaEspecialidad = data.referencia;

                // 2. Redirigir a Signos Vitales con parámetros
                // Pasamos ID de referencia, Nómina, Beneficiario (si existe) y Tipo de Paciente explícito
                const tipoPacienteStr = referencia.es_empleado ? 'empleado' : 'beneficiario';
                const url = `/dashboard/consultas/signos-vitales?referencia=${idReferencia}&nomina=${referencia.no_nomina}&tipoPaciente=${tipoPacienteStr}${referencia.id_beneficiario ? `&beneficiario=${referencia.id_beneficiario}` : ''
                    }`;

                router.push(url);

            } catch (err: any) {
                console.error('Error al iniciar atención:', err);
                setError(err.message || 'Ocurrió un error inesperado');
            }
        };

        if (idReferencia) {
            iniciarAtencion();
        }
    }, [idReferencia, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className={`max-w-md w-full p-6 rounded-xl shadow-lg ${isDark ? 'bg-[#0d1f2d] border border-red-500/30' : 'bg-white border border-red-200'
                    }`}>
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
                    <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-[#0a1929]' : 'bg-gray-50'
            }`}>
            <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'
                }`} />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                Iniciando consulta...
            </h2>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Preparando expediente del paciente
            </p>
        </div>
    );
}
