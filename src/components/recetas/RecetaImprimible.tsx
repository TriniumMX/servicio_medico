'use client';

import { forwardRef, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface RecetaImprimibleProps {
  recetaData: {
    folio_receta: string;
    folio_consulta: string;
    fecha_emision: string;
    paciente: {
      nombre: string;
      edad?: number;
      no_nomina: string;
      departamento?: string;
      es_empleado: boolean;
    };
    medico: {
      nombre: string;
      cedula?: string;
    };
    medicamentos: Array<{
      nombre_comercial: string;
      sustancia_activa: string;
      dosis: string;
      duracion_tratamiento_dias: number;
      cantidad_total: number;
      indicaciones?: string;
      realizar_resurtimiento: boolean;
      meses_resurtimiento?: number;
    }>;
    diagnostico?: {
      codigo: string;
      titulo: string;
    };
  };
}

const RecetaImprimible = forwardRef<HTMLDivElement, RecetaImprimibleProps>(
  ({ recetaData }, ref) => {
    const barcodeRef1 = useRef<SVGSVGElement>(null);
    const barcodeRef2 = useRef<SVGSVGElement>(null);

    // Generar código de barras único basado en el folio de la receta
    const generarCodigoBarras = (folio: string | undefined) => {
      if (!folio) {
        // Si no hay folio, generar uno temporal basado en timestamp
        return Date.now().toString().slice(-12).padStart(12, '0');
      }
      // Formato: R2025000123 (removemos guiones y hacemos numérico)
      return folio.replace(/[^0-9]/g, '').padStart(12, '0');
    };

    const codigoBarras = generarCodigoBarras(recetaData.folio_receta);

    useEffect(() => {
      if (barcodeRef1.current) {
        try {
          JsBarcode(barcodeRef1.current, codigoBarras, {
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

      if (barcodeRef2.current) {
        try {
          JsBarcode(barcodeRef2.current, codigoBarras, {
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
        {/* HOJA 1 - PARA FARMACIA (CON CÓDIGO DE BARRAS) */}
        <div className="w-[8.5in] h-[11in] p-8 bg-white page-break">
          {/* Header */}
          <div className="border-b-2 border-blue-600 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-blue-900">
                  Hospital San Juan del Río
                </h1>
                <p className="text-sm text-gray-600">Sistema Médico SJR</p>
                <p className="text-xs text-gray-500">
                  Calle Principal #123, San Juan del Río, Qro.
                </p>
              </div>
              <div className="text-right">
                <div className="bg-blue-100 px-4 py-2 rounded">
                  <p className="text-xs text-blue-800 font-semibold">
                    RECETA MÉDICA
                  </p>
                  <p className="text-lg font-bold text-blue-900">
                    {recetaData.folio_receta}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formatearFecha(recetaData.fecha_emision)}
                </p>
              </div>
            </div>
          </div>

          {/* Código de Barras - FARMACIA */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-yellow-800 mb-1">
                  🏥 COPIA PARA FARMACIA
                </p>
                <p className="text-xs text-yellow-700">
                  Escanear para surtir medicamentos
                </p>
              </div>
              <div className="flex items-center justify-center bg-white p-2 rounded">
                <svg ref={barcodeRef1}></svg>
              </div>
            </div>
          </div>

          {/* Información del Paciente */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                DATOS DEL PACIENTE
              </h3>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-semibold">Nombre:</span>{' '}
                  {recetaData.paciente.nombre}
                </p>
                <p>
                  <span className="font-semibold">Nómina:</span>{' '}
                  {recetaData.paciente.no_nomina}
                </p>
                {recetaData.paciente.edad && (
                  <p>
                    <span className="font-semibold">Edad:</span>{' '}
                    {recetaData.paciente.edad} años
                  </p>
                )}
                {recetaData.paciente.departamento && (
                  <p>
                    <span className="font-semibold">Departamento:</span>{' '}
                    {recetaData.paciente.departamento}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Tipo:</span>{' '}
                  {recetaData.paciente.es_empleado
                    ? 'Empleado'
                    : 'Beneficiario'}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                MÉDICO RESPONSABLE
              </h3>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-semibold">Nombre:</span>{' '}
                  {recetaData.medico.nombre}
                </p>
                {recetaData.medico.cedula && (
                  <p>
                    <span className="font-semibold">Cédula:</span>{' '}
                    {recetaData.medico.cedula}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Consulta:</span>{' '}
                  {recetaData.folio_consulta}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          {recetaData.diagnostico && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h3 className="text-xs font-bold text-blue-800 mb-1">
                DIAGNÓSTICO (CIE-11)
              </h3>
              <p className="text-xs text-blue-900">
                <span className="font-semibold">
                  {recetaData.diagnostico.codigo}
                </span>{' '}
                - {recetaData.diagnostico.titulo}
              </p>
            </div>
          )}

          {/* Medicamentos Prescritos */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">
              MEDICAMENTOS PRESCRITOS
            </h3>
            <div className="space-y-3">
              {recetaData.medicamentos.map((med, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 bg-gray-50 p-3"
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
                      <p className="text-xs font-semibold text-blue-600">
                        Cantidad: {med.cantidad_total} pzs
                      </p>
                      {med.realizar_resurtimiento && (
                        <p className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1 inline-block">
                          📅 Resurtimiento {med.meses_resurtimiento} meses
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="font-semibold">Dosis:</span> {med.dosis}
                    </p>
                    <p>
                      <span className="font-semibold">Duración:</span>{' '}
                      {med.duracion_tratamiento_dias} días
                    </p>
                    {med.indicaciones && (
                      <p>
                        <span className="font-semibold">Indicaciones:</span>{' '}
                        {med.indicaciones}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 mt-8">
            <div className="flex justify-between items-end">
              <div className="text-xs text-gray-600">
                <p>Receta válida por 30 días</p>
                <p className="text-xs text-gray-500 mt-1">
                  Conserve esta receta para su control
                </p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 w-48 mb-1"></div>
                <p className="text-xs text-gray-600">Firma del Médico</p>
              </div>
            </div>
          </div>
        </div>

        {/* HOJA 2 - PARA EL PACIENTE (SIN CÓDIGO DE BARRAS) */}
        <div className="w-[8.5in] h-[11in] p-8 bg-white">
          {/* Header */}
          <div className="border-b-2 border-green-600 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-green-900">
                  Hospital San Juan del Río
                </h1>
                <p className="text-sm text-gray-600">Sistema Médico SJR</p>
                <p className="text-xs text-gray-500">
                  Calle Principal #123, San Juan del Río, Qro.
                </p>
              </div>
              <div className="text-right">
                <div className="bg-green-100 px-4 py-2 rounded">
                  <p className="text-xs text-green-800 font-semibold">
                    RECETA MÉDICA
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {recetaData.folio_receta}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {formatearFecha(recetaData.fecha_emision)}
                </p>
              </div>
            </div>
          </div>

          {/* Banner PACIENTE */}
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-3 mb-6">
            <p className="text-xs font-bold text-green-800 mb-1">
              👤 COPIA PARA EL PACIENTE
            </p>
            <p className="text-xs text-green-700">
              Conserve esta receta. La necesitará para resurtimientos futuros.
            </p>
          </div>

          {/* Información del Paciente */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                DATOS DEL PACIENTE
              </h3>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-semibold">Nombre:</span>{' '}
                  {recetaData.paciente.nombre}
                </p>
                <p>
                  <span className="font-semibold">Nómina:</span>{' '}
                  {recetaData.paciente.no_nomina}
                </p>
                {recetaData.paciente.edad && (
                  <p>
                    <span className="font-semibold">Edad:</span>{' '}
                    {recetaData.paciente.edad} años
                  </p>
                )}
                {recetaData.paciente.departamento && (
                  <p>
                    <span className="font-semibold">Departamento:</span>{' '}
                    {recetaData.paciente.departamento}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Tipo:</span>{' '}
                  {recetaData.paciente.es_empleado
                    ? 'Empleado'
                    : 'Beneficiario'}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                MÉDICO RESPONSABLE
              </h3>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="font-semibold">Nombre:</span>{' '}
                  {recetaData.medico.nombre}
                </p>
                {recetaData.medico.cedula && (
                  <p>
                    <span className="font-semibold">Cédula:</span>{' '}
                    {recetaData.medico.cedula}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Consulta:</span>{' '}
                  {recetaData.folio_consulta}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          {recetaData.diagnostico && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h3 className="text-xs font-bold text-green-800 mb-1">
                DIAGNÓSTICO (CIE-11)
              </h3>
              <p className="text-xs text-green-900">
                <span className="font-semibold">
                  {recetaData.diagnostico.codigo}
                </span>{' '}
                - {recetaData.diagnostico.titulo}
              </p>
            </div>
          )}

          {/* Medicamentos Prescritos */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-1">
              MEDICAMENTOS PRESCRITOS
            </h3>
            <div className="space-y-3">
              {recetaData.medicamentos.map((med, index) => (
                <div
                  key={index}
                  className="border-l-4 border-green-500 bg-gray-50 p-3"
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
                      <p className="text-xs font-semibold text-green-600">
                        Cantidad: {med.cantidad_total} pzs
                      </p>
                      {med.realizar_resurtimiento && (
                        <p className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded mt-1 inline-block">
                          📅 Resurtimiento {med.meses_resurtimiento} meses
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    <p>
                      <span className="font-semibold">Dosis:</span> {med.dosis}
                    </p>
                    <p>
                      <span className="font-semibold">Duración:</span>{' '}
                      {med.duracion_tratamiento_dias} días
                    </p>
                    {med.indicaciones && (
                      <p>
                        <span className="font-semibold">Indicaciones:</span>{' '}
                        {med.indicaciones}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones para Resurtimiento */}
          {recetaData.medicamentos.some((m) => m.realizar_resurtimiento) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h3 className="text-xs font-bold text-blue-800 mb-2">
                📅 INSTRUCCIONES PARA RESURTIMIENTO
              </h3>
              <ul className="text-xs text-blue-900 space-y-1 list-disc list-inside">
                <li>
                  Conserve esta receta, la necesitará para sus resurtimientos
                </li>
                <li>
                  Acuda al módulo de <strong>Resurtimiento</strong> en las
                  fechas indicadas
                </li>
                <li>
                  Se le generará una nueva receta con código de barras para
                  farmacia
                </li>
                <li>
                  Presente su receta original cada vez que requiera resurtir
                </li>
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 mt-8">
            <div className="flex justify-between items-end">
              <div className="text-xs text-gray-600">
                <p>Receta válida por 30 días</p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>IMPORTANTE:</strong> Conserve esta receta
                </p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-400 w-48 mb-1"></div>
                <p className="text-xs text-gray-600">Firma del Médico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RecetaImprimible.displayName = 'RecetaImprimible';

export default RecetaImprimible;
