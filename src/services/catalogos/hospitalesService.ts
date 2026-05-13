// src/services/hospitalesService.ts

import { Hospital, HospitalesResponse } from '@/types/catalogos/hospitales';

export const HospitalesService = {
  /**
   * Obtiene todos los hospitales y formatea si es necesario
   */
  getAll: async (): Promise<Hospital[]> => {
    const response = await fetch('/api/catalogos/hospitales', { cache: 'no-store' });
    const data: HospitalesResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Error al cargar hospitales');
    }

    return data.data;
  },

  /**
   * Crea un nuevo hospital
   */
  create: async (hospital: Partial<Hospital>): Promise<void> => {
    const response = await fetch('/api/catalogos/hospitales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospital),
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Error al guardar');
    }
  },
   update: async (hospital: Partial<Hospital>): Promise<void> => {
    const response = await fetch('/api/catalogos/hospitales', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospital),
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  },

  // NUEVO: Eliminar (por defecto lógico)
  delete: async (id: number, tipo: 'logico' | 'fisico' = 'logico'): Promise<void> => {
    const response = await fetch(`/api/catalogos/hospitales?id=${id}&tipo=${tipo}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
  }
};

  

