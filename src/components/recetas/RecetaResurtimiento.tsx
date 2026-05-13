'use client';

import { forwardRef, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface RecetaResurtimientoProps {
  recetaData: {
    folio_receta_original: string;
    folio_receta: string; // Folio de la receta de resurtimiento
    fecha_emision: string;
    paciente: {
      nombre: string;
      nomina: string;
    };
    medicamentos: Array<{
      nombre_comercial: string;
      sustancia_activa: string;
      dosis: string;
      cantidad_total: number;
      numero_resurtimiento: number;
      id_control: number;
    }>;
  };
}

const RecetaResurtimiento = forwardRef<HTMLDivElement, RecetaResurtimientoProps>(
  ({ recetaData }, ref) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    // Generar código de barras usando el FOLIO REAL de la receta
    // Formato: R-2025-000456 -> 2025000456 (solo números)
    const codigoBarras = recetaData.folio_receta.replace(/[^0-9]/g, '');

    useEffect(() => {
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, codigoBarras, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 10,
          });
        } catch (error) {
          console.error('Error generando código de barras:', error);
        }
      }
    }, [codigoBarras]);

    const formatearFecha = (fecha: string) => {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <div ref={ref} className="bg-white">
        {/* HOJA DE RESURTIMIENTO - CON CÓDIGO DE BARRAS */}
        <div className="w-[8.5in] h-[11in] p-8 bg-white">
          {/* Header */}
          <div className="border-b-2 border-purple-600 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-purple-900">
                  Hospital San Juan del Río
                </h1>
                <p className="text-sm text-gray-600">Sistema Médico SJR</p>
                <p className="text-xs text-gray-500">
                  Calle Principal #123, San Juan del Río, Qro.
                </p>
              </div>
              <div className="text-right">
                <div className="bg-purple-100 px-4 py-2 rounded">
                  <p className="text-xs text-purple-800 font-semibold">
                    🔄 RECETA RESURTIMIENTO
                  </p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatearFecha(recetaData.fecha_emision)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Receta Original */}
          <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-800 mb-1">
                  📋 RESURTIMIENTO DE RECETA ORIGINAL
                </p>
                <p className="text-sm font-semibold text-purple-900">
                  Folio Original: {recetaData.folio_receta_original}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Paciente: {recetaData.paciente.nombre} ({recetaData.paciente.nomina})
                </p>
              </div>
              <div className="text-right bg-white px-3 py-2 rounded border-2 border-purple-600">
                <p className="text-xs font-bold text-purple-800">Folio Resurtimiento</p>
                <p className="text-lg font-bold text-purple-900">{recetaData.folio_receta}</p>
              </div>
            </div>
          </div>

          {/* Código de Barras - FARMACIA */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-yellow-800 mb-1">
                  🏥 PARA FARMACIA - RESURTIMIENTO
                </p>
                <p className="text-xs text-yellow-700">
                  Escanear para surtir medicamentos del mes
                </p>
              </div>
              <div className="flex items-center justify-center bg-white p-2 rounded">
                <svg ref={barcodeRef}></svg>
              </div>
            </div>
          </div>

          {/* Medicamentos a Resurtir */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">
              MEDICAMENTOS A RESURTIR
            </h3>
            <div className="space-y-3">
              {recetaData.medicamentos.map((med, index) => (
                <div
                  key={index}
                  className="border-l-4 border-purple-500 bg-purple-50 p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {index + 1}. {med.nombre_comercial}
                      </p>
                      <p className="text-xs text-gray-600">
                        {med.sustancia_activa}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-purple-600">
                        Cantidad: {med.cantidad_total} pzs
                      </p>
                      <p className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded mt-1 inline-block">
                        📅 Resurtimiento #{med.numero_resurtimiento}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="font-semibold">Dosis:</span> {med.dosis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <h3 className="text-xs font-bold text-blue-800 mb-2">
              ℹ️ INSTRUCCIONES
            </h3>
            <ul className="text-xs text-blue-900 space-y-1 list-disc list-inside">
              <li>Esta receta es válida únicamente para el resurtimiento indicado</li>
              <li>Presente esta receta en farmacia para recibir sus medicamentos</li>
              <li>Conserve su receta original para futuros resurtimientos</li>
              <li>En caso de dudas, consulte con su médico tratante</li>
            </ul>
          </div>

          {/* Aviso Importante */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
            <p className="text-xs font-bold text-orange-800 mb-1">
              ⚠️ AVISO IMPORTANTE
            </p>
            <p className="text-xs text-orange-700">
              Esta receta corresponde al resurtimiento programado de su tratamiento.
              No sustituye a la receta original. Presente ambas recetas en farmacia
              si es requerido.
            </p>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-8">
            <div className="flex justify-between items-end">
              <div className="text-xs text-gray-600">
                <p>Receta de resurtimiento válida por 15 días</p>
                <p className="text-xs text-gray-500 mt-1">
                  Generada: {formatearFecha(recetaData.fecha_emision)}
                </p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 w-48 mb-1"></div>
                <p className="text-xs text-gray-600">Sello de Farmacia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RecetaResurtimiento.displayName = 'RecetaResurtimiento';

export default RecetaResurtimiento;
