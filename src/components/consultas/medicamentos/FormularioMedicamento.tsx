'use client';

import { useState, useEffect } from 'react';
import { Medicamento, MedicamentoRecetado } from '@/types/consultas';
import { Trash2 } from 'lucide-react';

interface FormularioMedicamentoProps {
  medicamento: MedicamentoRecetado;
  medicamentos: Medicamento[];
  onChange: (medicamento: MedicamentoRecetado) => void;
  onRemove: () => void;
  canRemove: boolean;
  isDark: boolean;
}

export default function FormularioMedicamento({
  medicamento,
  medicamentos,
  onChange,
  onRemove,
  canRemove,
  isDark,
}: FormularioMedicamentoProps) {
  // Siempre trabajar con string (compatibilidad con nvarchar de BDD)
  const [selectValue, setSelectValue] = useState<string>('');
  const [selectedMed, setSelectedMed] = useState<Medicamento | null>(null);

  // Normalizar a string para comparaciones
  const normalizarClave = (clave: string | number | undefined | null): string => {
    if (clave === undefined || clave === null) return '';
    return String(clave);
  };

  // Inicializar el select con el valor actual
  useEffect(() => {
    const claveNormalizada = normalizarClave(medicamento.clavemedicamento);
    const valorInicial = claveNormalizada && claveNormalizada !== '0' ? claveNormalizada : '';

    console.log('🔧 [FormularioMedicamento] Inicializando:', {
      clavemedicamento_original: medicamento.clavemedicamento,
      tipo_original: typeof medicamento.clavemedicamento,
      claveNormalizada,
      valorInicial,
      nombreMedicamento: medicamento.nombre_medicamento
    });

    setSelectValue(valorInicial);

    // Buscar el medicamento seleccionado
    if (valorInicial && medicamentos.length > 0) {
      const med = medicamentos.find(m => normalizarClave(m.clavemedicamento) === valorInicial);
      console.log('🔍 [FormularioMedicamento] Buscando medicamento:', {
        buscando: valorInicial,
        encontrado: med ? med.medicamento : 'NO ENCONTRADO',
        totalMedicamentos: medicamentos.length,
        primerasClavesDisponibles: medicamentos.slice(0, 3).map(m => ({
          clave: m.clavemedicamento,
          tipo: typeof m.clavemedicamento,
          normalizada: normalizarClave(m.clavemedicamento)
        }))
      });
      setSelectedMed(med || null);
    }
  }, [medicamento.clavemedicamento, medicamentos]);

  const handleMedicamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valorSeleccionado = e.target.value; // Ya es string

    console.log('🎯 [handleMedicamentoChange] Usuario seleccionó:', {
      valor: valorSeleccionado,
      tipo: typeof valorSeleccionado
    });

    if (!valorSeleccionado || valorSeleccionado === '') {
      console.log('⚠️ [handleMedicamentoChange] Valor vacío, reseteando');
      setSelectValue('');
      setSelectedMed(null);
      return;
    }

    // Buscar el medicamento en la lista (comparación de strings)
    const medEncontrado = medicamentos.find(m =>
      normalizarClave(m.clavemedicamento) === valorSeleccionado
    );

    console.log('🔍 [handleMedicamentoChange] Búsqueda de medicamento:', {
      claveBuscada: valorSeleccionado,
      encontrado: medEncontrado ? medEncontrado.medicamento : 'NO ENCONTRADO',
      primerasClavesDisponibles: medicamentos.slice(0, 5).map(m => ({
        clave: m.clavemedicamento,
        tipo: typeof m.clavemedicamento,
        normalizada: normalizarClave(m.clavemedicamento),
        coincide: normalizarClave(m.clavemedicamento) === valorSeleccionado,
        nombre: m.medicamento
      }))
    });

    if (!medEncontrado) {
      console.error('❌ [handleMedicamentoChange] No se encontró el medicamento con clave:', valorSeleccionado);
      return;
    }

    // Actualizar estado local
    setSelectValue(valorSeleccionado);
    setSelectedMed(medEncontrado);

    // Notificar al componente padre (mantener como string)
    console.log('✅ [handleMedicamentoChange] Notificando al padre:', {
      clavemedicamento: medEncontrado.clavemedicamento,
      tipo: typeof medEncontrado.clavemedicamento,
      nombre_medicamento: medEncontrado.medicamento
    });

    onChange({
      ...medicamento,
      clavemedicamento: medEncontrado.clavemedicamento, // Mantener tipo original (string)
      nombre_medicamento: medEncontrado.medicamento,
    });
  };

  const handleDiasChange = (dias: number) => {
    console.log('📅 [handleDiasChange] Días cambiados:', dias);
    onChange({
      ...medicamento,
      tratamiento_dias: dias,
      realizar_resurtimiento: dias === 30 ? medicamento.realizar_resurtimiento : false,
      meses_resurtimiento: dias === 30 ? medicamento.meses_resurtimiento : null,
    });
  };

  const handleResurtimientoToggle = () => {
    const nuevoValor = !medicamento.realizar_resurtimiento;
    console.log('🔄 [handleResurtimientoToggle] Toggle:', nuevoValor);
    onChange({
      ...medicamento,
      realizar_resurtimiento: nuevoValor,
      meses_resurtimiento: nuevoValor ? 2 : null,
    });
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'stock bajo':
        return isDark ? 'text-red-400' : 'text-red-600';
      case 'stock alto':
        return isDark ? 'text-green-400' : 'text-green-600';
      default:
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
    }
  };

  console.log('🎨 [FormularioMedicamento] Renderizando con selectValue:', selectValue);

  return (
    <div className={`rounded-xl shadow-lg p-6 border ${
      isDark ? 'bg-[#0a1929] border-[#0f83b2]/30' : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Medicamento
        </h3>
        {canRemove && (
          <button
            onClick={onRemove}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
            }`}
            title="Eliminar medicamento"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select de Medicamento */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Medicamento *
          </label>
          <select
            value={selectValue}
            onChange={handleMedicamentoChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-transparent transition-colors ${
              isDark
                ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
          >
            <option value="">Seleccione un medicamento</option>
            {medicamentos.map((med, index) => (
              <option
                key={`${med.clavemedicamento}-${index}`}
                value={normalizarClave(med.clavemedicamento)}
              >
                {med.medicamento} - {med.presentacion} ({med.stockstatus})
              </option>
            ))}
          </select>

          {/* Info del medicamento seleccionado */}
          {selectedMed && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${
              isDark ? 'bg-[#0d1f2d]' : 'bg-gray-50'
            }`}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>Clasificación:</span>
                  <span className={`ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedMed.clasificacion}
                  </span>
                </div>
                <div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>Piezas:</span>
                  <span className={`ml-2 font-semibold ${getStockColor(selectedMed.stockstatus)}`}>
                    {selectedMed.piezas} en fondo fijo
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Indicaciones */}
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Indicaciones *
          </label>
          <textarea
            value={medicamento.indicaciones}
            onChange={(e) => onChange({ ...medicamento, indicaciones: e.target.value })}
            placeholder="Ej: Tomar 1 tableta cada 8 horas con alimentos"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-transparent resize-none transition-colors ${
              isDark
                ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
            rows={3}
            required
          />
        </div>

        {/* Tratamiento (Días) */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Tratamiento (Días) *
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="30"
              value={medicamento.tratamiento_dias}
              onChange={(e) => handleDiasChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                1 día
              </span>
              <span className={`text-2xl font-bold ${
                isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'
              }`}>
                {medicamento.tratamiento_dias} {medicamento.tratamiento_dias === 1 ? 'día' : 'días'}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                30 días
              </span>
            </div>
          </div>
        </div>

        {/* Piezas */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Piezas a Dar *
          </label>
          <input
            type="number"
            min="1"
            value={medicamento.piezas}
            onChange={(e) => onChange({ ...medicamento, piezas: parseInt(e.target.value) || 1 })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-transparent transition-colors ${
              isDark
                ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
          />
        </div>

        {/* Resurtimiento (solo si son 30 días) */}
        {medicamento.tratamiento_dias === 30 && (
          <>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                ¿Realizar Resurtimiento?
              </label>
              <button
                type="button"
                onClick={handleResurtimientoToggle}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  medicamento.realizar_resurtimiento
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    medicamento.realizar_resurtimiento ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
                <span className={`absolute text-xs font-semibold ${
                  medicamento.realizar_resurtimiento
                    ? 'left-2 text-white'
                    : 'right-2 text-white'
                }`}>
                  {medicamento.realizar_resurtimiento ? 'SÍ' : 'NO'}
                </span>
              </button>
            </div>

            {/* Meses de resurtimiento */}
            {medicamento.realizar_resurtimiento && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Meses de Resurtimiento *
                </label>
                <select
                  value={medicamento.meses_resurtimiento || 2}
                  onChange={(e) => onChange({ ...medicamento, meses_resurtimiento: parseInt(e.target.value) })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#0f83b2] focus:border-transparent transition-colors ${
                    isDark
                      ? 'bg-[#0d1f2d] border-[#0f83b2]/30 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                >
                  <option value={2}>2 meses</option>
                  <option value={3}>3 meses</option>
                  <option value={4}>4 meses</option>
                  <option value={5}>5 meses</option>
                  <option value={6}>6 meses</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
