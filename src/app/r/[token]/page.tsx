// src/app/r/[token]/page.tsx
import { obtenerRecetaPorToken } from '@/lib/receta-token';
import RecetaPublicaView from '@/components/recetas/RecetaPublicaView';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

/**
 * Página pública para visualizar recetas vía QR
 * No requiere autenticación
 */
export default async function RecetaPublicaPage({ params }: PageProps) {
  const { token } = await params;

  // Obtener datos de la receta usando el token
  const recetaData = await obtenerRecetaPorToken(token);

  // Si el token es inválido o expiró, mostrar 404
  if (!recetaData) {
    notFound();
  }

  return <RecetaPublicaView data={recetaData} />;
}

/**
 * Metadata dinámica para SEO
 */
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;

  try {
    const recetaData = await obtenerRecetaPorToken(token);

    if (!recetaData) {
      return {
        title: 'Receta no encontrada',
        description: 'La receta solicitada no existe o ha expirado.',
      };
    }

    return {
      title: `Receta Médica - ${recetaData.receta.folio_receta}`,
      description: `Receta médica para ${recetaData.consulta.nombre}`,
      robots: 'noindex, nofollow', // No indexar recetas médicas en buscadores
    };
  } catch (error) {
    return {
      title: 'Error',
      description: 'Error al cargar la receta',
    };
  }
}
