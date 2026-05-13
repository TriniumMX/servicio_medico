// src/components/referencias/especialista/ModalAccionPostConsulta.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, RefreshCw, CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idReferenciaOrigen: number;
  idConsultaEspecialista: number;
  isDark: boolean;
  onSuccessRedirect?: () => void;
}

type Paso = "elegir" | "seguimiento";

export default function ModalAccionPostConsulta({
  isOpen,
  onClose,
  idReferenciaOrigen,
  idConsultaEspecialista,
  isDark,
  onSuccessRedirect,
}: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("elegir");
  const [fechaSugerida, setFechaSugerida] = useState("");
  const [motivoSeguimiento, setMotivoSeguimiento] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Fecha mínima = hoy + 7 días
  const fechaMinima = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  const handleContrareferencia = () => {
    onClose();
    if (onSuccessRedirect) {
      onSuccessRedirect();
    } else {
      router.push(`/dashboard/referencias/especialista?tab=atendidas`);
    }
  };

  const handleCrearSeguimiento = async () => {
    if (!fechaSugerida) {
      setError("Selecciona una fecha tentativa para el seguimiento");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/referencias/seguimiento/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_referencia_origen: idReferenciaOrigen,
          id_consulta_especialista: idConsultaEspecialista,
          fecha_sugerida_seguimiento: new Date(fechaSugerida).toISOString(),
          motivo_seguimiento: motivoSeguimiento.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onClose();
        if (onSuccessRedirect) {
          onSuccessRedirect();
        } else {
          router.push("/dashboard/consultas/diagnostico");
        }
      } else {
        setError(data.error || "Error al crear el seguimiento");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden ${
          isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/30"
            : "bg-white border border-gray-200"
        }`}
      >
        {/* Barra superior */}
        <div className="h-1 bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2]" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Consulta Finalizada
              </h2>
              <p
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {paso === "elegir"
                  ? "¿Deseas generar algún documento adicional?"
                  : "Solicitud de seguimiento"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "text-gray-400 hover:bg-white/5 hover:text-white"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 pb-6">
          {paso === "elegir" ? (
            <div className="space-y-3">
              {/* Opción: Contrareferencia */}
              <button
                onClick={handleContrareferencia}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all group ${
                  isDark
                    ? "border-[#0f83b2]/30 bg-[#0f83b2]/5 hover:border-[#0db1ec]/60 hover:bg-[#0f83b2]/15"
                    : "border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition-colors ${
                    isDark
                      ? "bg-[#0f83b2]/20 group-hover:bg-[#0f83b2]/40"
                      : "bg-blue-100 group-hover:bg-blue-200"
                  }`}
                >
                  <ArrowRight className={`w-5 h-5 ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`} />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Contrareferencia
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    El paciente regresa con el médico general
                  </p>
                </div>
              </button>

              {/* Opción: Seguimiento */}
              <button
                onClick={() => setPaso("seguimiento")}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all group ${
                  isDark
                    ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10"
                    : "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl transition-colors ${
                    isDark
                      ? "bg-amber-500/20 group-hover:bg-amber-500/30"
                      : "bg-amber-100 group-hover:bg-amber-200"
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Solicitar Seguimiento
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    El paciente regresa con el especialista en una fecha tentativa
                  </p>
                </div>
              </button>

              {/* Salir sin acción */}
              <button
                onClick={onClose}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-gray-300 hover:bg-white/5"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                Continuar sin generar documento
              </button>
            </div>
          ) : (
            /* Paso 2: Formulario de seguimiento */
            <div className="space-y-4">
              {/* Fecha sugerida */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 inline mr-1.5 text-amber-500" />
                  Fecha tentativa de la próxima cita
                </label>
                <input
                  type="date"
                  value={fechaSugerida}
                  min={fechaMinima}
                  onChange={(e) => setFechaSugerida(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors text-sm ${
                    isDark
                      ? "bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 focus:border-amber-400"
                  } focus:outline-none focus:ring-2 focus:ring-amber-400/20`}
                />
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  Mínimo 7 días a partir de hoy
                </p>
              </div>

              {/* Motivo opcional */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1.5 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Motivo del seguimiento{" "}
                  <span
                    className={`font-normal text-xs ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    (opcional)
                  </span>
                </label>
                <textarea
                  value={motivoSeguimiento}
                  onChange={(e) => setMotivoSeguimiento(e.target.value)}
                  placeholder="Ej: Control de evolución, ajuste de tratamiento..."
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors resize-none text-sm ${
                    isDark
                      ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-amber-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-400"
                  } focus:outline-none focus:ring-2 focus:ring-amber-400/20`}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className={`p-3 rounded-xl text-sm ${
                    isDark
                      ? "bg-red-500/10 border border-red-500/30 text-red-300"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setPaso("elegir");
                    setError(null);
                  }}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                    isDark
                      ? "border-gray-700 text-gray-400 hover:bg-white/5"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  Volver
                </button>
                <button
                  onClick={handleCrearSeguimiento}
                  disabled={loading || !fechaSugerida}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isDark
                      ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/30"
                      : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Crear Seguimiento
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
