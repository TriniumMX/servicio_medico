import { useState } from "react";
import { X, Bell, User, Calendar, AlertCircle, Eye, RefreshCcw } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  onNotificar: (data: { medio_notificacion?: string; observaciones?: string }) => Promise<void>;
  isDark: boolean;
}

export default function ModalNotificarPaciente({
  referencia,
  isOpen,
  onClose,
  onNotificar,
  isDark,
}: Props) {
  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !referencia) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Pasar al siguiente paso (mostrar preview del pase)
      await onNotificar({
        medio_notificacion: "presencial",
        observaciones: observaciones || undefined,
      });

      // Reset form
      setObservaciones("");
    } catch (error) {
      console.error("Error al procesar notificación:", error);
      alert("Error al procesar la notificación. Por favor intente nuevamente.");
    } finally {
      setSubmitting(false);
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

  const esSeguimiento = referencia.tipo_referencia === 'seguimiento';
  const numConsulta = referencia.numero_consulta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-[#0a1929]" : "bg-white"} max-h-[90vh] flex flex-col`}
      >
        {/* Barra de color superior */}
        <div className={`h-1 ${esSeguimiento
          ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500'
          : 'bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2]'}`}
        />

        {/* Header */}
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${isDark
            ? "bg-[#0a1929] border-[#0f83b2]/20"
            : "bg-white border-gray-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${esSeguimiento
              ? isDark ? "bg-amber-500/20" : "bg-amber-100"
              : isDark ? "bg-[#0f83b2]/20" : "bg-blue-100"}`}>
              {esSeguimiento
                ? <RefreshCcw className={`w-6 h-6 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                : <Bell className={`w-6 h-6 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
              }
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Notificar al Paciente
                </h2>
                {esSeguimiento && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white tracking-wide">
                    <RefreshCcw className="w-3 h-3" />
                    SEGUIMIENTO{numConsulta ? ` · Consulta #${numConsulta}` : ''}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {referencia.folio || `#${referencia.id_referencia}`}
                {esSeguimiento && numConsulta && (
                  <span className={`ml-2 ${isDark ? "text-amber-400/70" : "text-amber-600/70"}`}>
                    · {numConsulta === 2 ? '2ª consulta' : numConsulta === 3 ? '3ª consulta' : `${numConsulta}ª consulta`} de seguimiento
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
              }`}
          >
            <X className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Banner seguimiento */}
          {esSeguimiento && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/25" : "bg-amber-50 border-amber-200"}`}>
              <RefreshCcw className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
              <div>
                <p className={`text-sm font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                  Referencia de seguimiento{numConsulta ? ` — ${numConsulta === 2 ? '2ª' : numConsulta === 3 ? '3ª' : `${numConsulta}ª`} consulta con el especialista` : ''}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-amber-400/80" : "text-amber-600"}`}>
                  El paciente fue referido por el especialista para dar continuidad a su tratamiento.
                  {referencia.fecha_sugerida_seguimiento && (
                    <> Fecha sugerida: <strong>{new Date(referencia.fecha_sugerida_seguimiento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Información del Paciente */}
          <div
            className={`p-4 rounded-lg border ${isDark ? "bg-[#0d2137] border-[#0f83b2]/20" : "bg-gray-50 border-gray-200"}`}
          >
            <h3
              className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              <User className="w-4 h-4" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Nombre:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.nombre_paciente}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Nómina:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.no_nomina}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Teléfono:
                </span>
                <p
                  className={`font-medium ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"
                    }`}
                >
                  {referencia.telefono || "No registrado"}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Email:
                </span>
                <p
                  className={`font-medium ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"
                    }`}
                >
                  {referencia.email || "No registrado"}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles de la Cita */}
          <div
            className={`p-4 rounded-lg border ${isDark
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-blue-50 border-blue-200"
              }`}
          >
            <h3
              className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-blue-300" : "text-blue-700"
                }`}
            >
              <Calendar className="w-4 h-4" />
              Detalles de la Cita
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Especialidad:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.nombre_especialidad}
                </p>
              </div>
              <div>
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Médico especialista:
                </span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {referencia.nombre_medico_asignado}
                </p>
              </div>
              <div className="col-span-2">
                <span
                  className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                >
                  Fecha y hora de la cita:
                </span>
                <p
                  className={`text-lg font-bold ${isDark ? "text-blue-300" : "text-blue-700"
                    }`}
                >
                  {referencia.fecha_cita ? formatDate(referencia.fecha_cita) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label
              className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              Observaciones (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales sobre la notificación..."
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${isDark
                ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0f83b2]"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2]"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          {/* Info */}
          <div
            className={`p-4 rounded-lg border ${isDark
              ? "bg-blue-500/10 border-blue-500/30"
              : "bg-blue-50 border-blue-200"
              }`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p
                className={`text-sm ${isDark ? "text-blue-300" : "text-blue-700"}`}
              >
                En el siguiente paso podrá ver la <strong>vista previa de la Referencia a Especialidad</strong> antes de confirmar la notificación.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${isDark
                ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:to-[#0db1ec] text-white"
                : "bg-gradient-to-r from-[#0f83b2] to-[#0a7aa0] hover:to-[#0a7aa0] text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Ver Vista Previa de la Referencia
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
