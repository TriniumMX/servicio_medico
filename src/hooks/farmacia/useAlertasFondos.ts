// src/hooks/farmacia/useAlertasFondos.ts

import { useState, useCallback } from 'react';
import type {
  CorreoAlerta,
  CorreoAlertaForm,
  MedicamentoAlerta,
  ResumenAlertas,
  CorreosAlertaResponse,
  CorreoAlertaResponse,
  MedicamentosAlertaResponse,
  EnviarAlertaResponse,
  VerificarNivelesResponse,
} from '@/types/alertas-fondos';

export function useAlertasFondos() {
  // Estados
  const [correos, setCorreos] = useState<CorreoAlerta[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoAlerta[]>([]);
  const [resumen, setResumen] = useState<ResumenAlertas | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEnvio, setLoadingEnvio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los correos configurados
  const obtenerCorreos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alertas-fondos/correos');
      const data: CorreosAlertaResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener correos');
      }

      setCorreos(data.data || []);
      return data.data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar nuevo correo
  const agregarCorreo = useCallback(async (datos: CorreoAlertaForm) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alertas-fondos/correos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });

      const data: CorreoAlertaResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al agregar correo');
      }

      // Actualizar lista local
      if (data.data) {
        setCorreos((prev) => [...prev, data.data!]);
      }

      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar correo
  const actualizarCorreo = useCallback(async (idCorreo: number, datos: Partial<CorreoAlertaForm>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/alertas-fondos/correos/${idCorreo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });

      const data: CorreoAlertaResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar correo');
      }

      // Actualizar lista local
      if (data.data) {
        setCorreos((prev) =>
          prev.map((c) => (c.id_correo === idCorreo ? data.data! : c))
        );
      }

      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar correo
  const eliminarCorreo = useCallback(async (idCorreo: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/alertas-fondos/correos/${idCorreo}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al eliminar correo');
      }

      // Actualizar lista local
      setCorreos((prev) => prev.filter((c) => c.id_correo !== idCorreo));

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle activo/inactivo
  const toggleActivo = useCallback(async (idCorreo: number) => {
    const correo = correos.find((c) => c.id_correo === idCorreo);
    if (!correo) return;

    return actualizarCorreo(idCorreo, { activo: !correo.activo });
  }, [correos, actualizarCorreo]);

  // Verificar niveles y obtener medicamentos con alerta
  const verificarNiveles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alertas-fondos/verificar');
      const data: VerificarNivelesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al verificar niveles');
      }

      setMedicamentos(data.medicamentos || []);
      setResumen(data.resumen || null);

      return {
        hayAlertas: data.hayAlertas,
        resumen: data.resumen,
        medicamentos: data.medicamentos,
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enviar alerta por correo
  const enviarAlerta = useCallback(async () => {
    setLoadingEnvio(true);
    setError(null);
    try {
      const response = await fetch('/api/alertas-fondos/enviar', {
        method: 'POST',
      });

      const data: EnviarAlertaResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al enviar alerta');
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoadingEnvio(false);
    }
  }, []);

  // Descargar reporte PDF
  const descargarPDF = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alertas-fondos/reporte-pdf');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar PDF');
      }

      // Obtener el blob del PDF
      const blob = await response.blob();

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Obtener nombre del archivo del header o usar uno por defecto
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `reporte-alertas-${new Date().toISOString().split('T')[0]}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar error
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    correos,
    medicamentos,
    resumen,
    loading,
    loadingEnvio,
    error,

    // Acciones para correos
    obtenerCorreos,
    agregarCorreo,
    actualizarCorreo,
    eliminarCorreo,
    toggleActivo,

    // Acciones para alertas
    verificarNiveles,
    enviarAlerta,
    descargarPDF,

    // Utilidades
    limpiarError,
  };
}
