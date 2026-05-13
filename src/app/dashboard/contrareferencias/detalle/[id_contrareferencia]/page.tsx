//src/app/dashboard/contrareferencias/detalle/[id_contrareferencia]/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  ArrowLeftCircle,
  ArrowLeft,
  User,
  FileText,
  Activity,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  Calendar,
  Info
} from "lucide-react";
import type { ContrarreferenciasDetalle, InfoCascada } from "@/types/contrareferencias";

export default function DetalleContrarreferencia() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [detalle, setDetalle] = useState<ContrarreferenciasDetalle | null>(null);
  const [infoCascada, setInfoCascada] = useState<InfoCascada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marcandoVista, setMarcandoVista] = useState(false);

  const id_contrareferencia = params.id_contrareferencia as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && id_contrareferencia) {
      cargarDetalle();
    }
  }, [mounted, id_contrareferencia]);

  const isDark = mounted && theme === "dark";

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/contrareferencias/detalle/${id_contrareferencia}`
      );
      const data = await response.json();

      if (data.success) {
        setDetalle(data.contrareferencia);
        setInfoCascada(data.infoCascada);
      } else {
        setError(data.error || "Error al cargar detalle");
      }
    } catch (error) {
      console.error("Error al cargar detalle:", error);
      setError("Error de conexión al cargar detalle");
    } finally {
      setLoading(false);
    }
  };

  const marcarComoVista = async () => {
    try {
      setMarcandoVista(true);
      const response = await fetch("/api/contrareferencias/marcar-vista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_contrareferencia: Number(id_contrareferencia) })
      });

      const data = await response.json();
      if (data.success) {
        await cargarDetalle();
      }
    } catch (error) {
      console.error("Error al marcar como vista:", error);
    } finally {
      setMarcandoVista(false);
    }
  };

  const parsearPlan = (planString: string | null) => {
    if (!planString) return null;
    try {
      return JSON.parse(planString);
    } catch (e) {
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
              }`}
          ></div>
          <p className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
            Cargando detalle...
          </p>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="space-y-6 pb-20">
        <div
          className={`rounded-xl shadow-lg p-6 border-2 ${isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className={`font-bold ${isDark ? "text-red-300" : "text-red-700"}`}>
                Error
              </h3>
              <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
                {error || "No se pudo cargar la contrareferencia"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
      </div>
    );
  }

  const planParsed = parsearPlan(detalle.plan_texto);
  const medicamentos = planParsed?.medicamentos?.medicamentos || [];
  const estudios = planParsed?.laboratorio?.estudios || [];
  const incapacidad = planParsed?.incapacidad;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div
        className={`rounded-xl shadow-lg p-6 ${isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                }`}
            >
              <ArrowLeft className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
            </button>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
              <ArrowLeftCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                Detalle de Contrareferencia
              </h1>
              <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Folio: {detalle.folio}
              </p>
            </div>
          </div>

          {detalle.estatus === "pendiente" && (
            <button
              onClick={marcarComoVista}
              disabled={marcandoVista}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
                } disabled:opacity-50`}
            >
              {marcandoVista ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Marcando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Marcar como Vista
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Información de Cascada */}
      {infoCascada && infoCascada.debe_continuar_cascada && (
        <div
          className={`rounded-xl shadow-lg p-6 border-2 ${isDark
              ? "bg-purple-500/10 border-purple-500/30"
              : "bg-purple-50 border-purple-200"
            }`}
        >
          <div className="flex items-start gap-3">
            <Info className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isDark ? "text-purple-300" : "text-purple-600"}`} />
            <div className="space-y-2 flex-1">
              <h3 className={`text-lg font-bold ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                Contrareferencia en Cascada
              </h3>
              <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Esta contrareferencia es parte de una cadena. Debes contrareferir al siguiente médico:
              </p>
              <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {infoCascada.nombre_medico_siguiente}
                {infoCascada.es_medico_general && " (Médico General - Fin de cascada)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información del Paciente */}
      <div className={`rounded-xl shadow-lg p-6 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          <User className="w-5 h-5" />
          Información del Paciente
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Nombre:</span>
            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{detalle.nombre_paciente}</p>
          </div>
          <div>
            <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Nómina:</span>
            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{detalle.no_nomina}</p>
          </div>
        </div>
      </div>

      {/* Información del Especialista */}
      <div className={`rounded-xl shadow-lg p-6 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          <Stethoscope className="w-5 h-5" />
          Especialista que Contrarrefiere
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Médico:</span>
            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{detalle.nombre_medico_contrarrefiere}</p>
          </div>
          <div>
            <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Especialidad:</span>
            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{detalle.nombre_especialidad_remitente}</p>
          </div>
          <div>
            <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Fecha de Creación:</span>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{formatDate(detalle.creado_en)}</p>
          </div>
          {detalle.es_parte_cascada && (
            <div>
              <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Nivel de Cascada:</span>
              <p className={`font-bold ${isDark ? "text-purple-300" : "text-purple-600"}`}>Nivel {detalle.nivel_cascada}</p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnóstico */}
      {/* Diagnóstico */}
      {((detalle.diagnosticos_json && detalle.diagnosticos_json.length > 0) || detalle.cie11_codigo) && (
        <div className={`rounded-xl shadow-lg p-6 border-2 ${isDark ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200"}`}>
          <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-purple-300" : "text-purple-700"}`}>
            Diagnóstico
          </h3>

          {detalle.diagnosticos_json && detalle.diagnosticos_json.length > 0 ? (
            <ul className="space-y-2">
              {detalle.diagnosticos_json.map((diag, idx) => (
                <li key={idx} className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                  <span className="font-bold">{diag.es_principal ? '(Principal) ' : ''}</span>
                  {diag.codigo} - {diag.titulo}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
              {detalle.cie11_codigo} - {detalle.cie11_titulo || "Sin título"}
            </p>
          )}
        </div>
      )}

      {/* SOAP */}
      <div className={`rounded-xl shadow-lg p-6 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
        <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
          <FileText className="w-6 h-6" />
          SOAP del Especialista
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
            <h4 className={`font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Subjetivo</h4>
            <p className={`whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {detalle.subjetivo || "No registrado"}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
            <h4 className={`font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Objetivo / Exploración</h4>
            <p className={`whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {detalle.objetivo || "No registrado"}
            </p>
          </div>
          <div className={`p-4 rounded-lg md:col-span-2 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
            <h4 className={`font-bold mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>Análisis</h4>
            <p className={`whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {detalle.analisis || "No registrado"}
            </p>
          </div>
        </div>
      </div>

      {/* Observaciones Adicionales */}
      {detalle.observaciones_especialista && (
        <div className={`rounded-xl shadow-lg p-6 border ${isDark ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
          <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
            Observaciones del Especialista
          </h3>
          <p className={`whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {detalle.observaciones_especialista}
          </p>
        </div>
      )}

      {/* Medicamentos */}
      {medicamentos.length > 0 && (
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <Activity className="w-5 h-5 text-green-500" />
            Medicamentos Recetados
          </h3>
          <div className="space-y-3">
            {medicamentos.map((med: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {med.nombre_medicamento || med.nombre_comercial}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  {med.indicaciones}
                </p>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Cantidad: {med.piezas} | Duración: {med.tratamiento_dias} días
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estudios de Laboratorio */}
      {estudios.length > 0 && (
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white border border-gray-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            <Activity className="w-5 h-5 text-orange-500" />
            Estudios Solicitados
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {estudios.map((est: any, idx: number) => (
              <li key={idx} className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {est.nombre_estudio || "Estudio de laboratorio"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Incapacidad */}
      {incapacidad && (
        <div className={`rounded-xl shadow-lg p-6 border ${isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"}`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-red-300" : "text-red-700"}`}>
            <Calendar className="w-5 h-5" />
            Incapacidad Emitida
          </h3>
          <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Días de incapacidad: <span className="font-bold">{incapacidad.dias}</span>
          </p>
        </div>
      )}
    </div>
  );
}
