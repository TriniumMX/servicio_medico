// src/hooks/catalogos/useBeneficiarios.ts

import { useState } from 'react';
import type { Beneficiario, BeneficiariosResponse } from '@/types/catalogos/beneficiarios';

export const useBeneficiarios = () => {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerBeneficiarios = async (num_nom: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/catalogos/beneficiarios/get?num_nom=${num_nom}`);
      const data: BeneficiariosResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener beneficiarios');
      }

      if (data.success && data.data) {
        setBeneficiarios(data.data);
        return data.data;
      } else {
        setBeneficiarios([]);
        return [];
      }
    } catch (err: any) {
      setError(err.message);
      setBeneficiarios([]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const limpiarBeneficiarios = () => {
    setBeneficiarios([]);
    setError(null);
  };

  return {
    beneficiarios,
    loading,
    error,
    obtenerBeneficiarios,
    limpiarBeneficiarios,
  };
};