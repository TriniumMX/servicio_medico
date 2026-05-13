import { X, User, Calendar, FileText, CheckCircle, Send, UserCheck, Pencil } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import { useState } from "react";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function ModalDetalleReferenciaAutorizada({ referencia, isOpen, onClose, isDark }: Props) {
  const [mostrarFirma, setMostrarFirma] = useState(false);

  if (!isOpen || !referencia) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Función para obtener la firma con el formato correcto
  const obtenerFirmaBase64 = (firma: string | null | undefined): string | null => {
    if (!firma) return null;

    // Si ya tiene el prefijo data:image, retornarlo tal cual
    if (firma.startsWith('data:image/')) {
      return firma;
    }

    // Si no tiene el prefijo, agregarlo
    return `data:image/png;base64,${firma}`;
  };

  const getEstatusInfo = (estatus: string) => {
    switch (estatus) {
      case "autorizada":
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          label: "Autorizada",
          bgColor: isDark ? "bg-green-500/10" : "bg-green-50",
          textColor: isDark ? "text-green-300" : "text-green-700",
          borderColor: isDark ? "border-green-500/20" : "border-green-200"
        };
      case "notificada":
        return {
          icon: <Send className="w-6 h-6" />,
          label: "Notificada al Paciente",
          bgColor: isDark ? "bg-blue-500/10" : "bg-blue-50",
          textColor: isDark ? "text-blue-300" : "text-blue-700",
          borderColor: isDark ? "border-blue-500/20" : "border-blue-200"
        };
      case "atendida":
        return {
          icon: <UserCheck className="w-6 h-6" />,
          label: "Atendida por Especialista",
          bgColor: isDark ? "bg-purple-500/10" : "bg-purple-50",
          textColor: isDark ? "text-purple-300" : "text-purple-700",
          borderColor: isDark ? "border-purple-500/20" : "border-purple-200"
        };
      default:
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          label: estatus,
          bgColor: isDark ? "bg-gray-500/10" : "bg-gray-50",
          textColor: isDark ? "text-gray-300" : "text-gray-700",
          borderColor: isDark ? "border-gray-500/20" : "border-gray-200"
        };
    }
  };

  const estatusInfo = getEstatusInfo(referencia.estatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDark ? "bg-[#0a1929] border border-[#0f83b2]/20" : "bg-white"} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isDark ? "bg-[#0d2137] border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${estatusInfo.bgColor}`}>
              {estatusInfo.icon}
            </div>
            <div>
              <h2 className={`text-xl font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                Detalle de Referencia
              </h2>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Referencia #{referencia.id_referencia} - {estatusInfo.label}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Estatus Badge */}
          <div className={`p-4 rounded-xl border ${estatusInfo.bgColor} ${estatusInfo.borderColor}`}>
            <div className="flex items-center gap-3">
              {estatusInfo.icon}
              <div>
                <h3 className={`text-lg font-bold ${estatusInfo.textColor}`}>{estatusInfo.label}</h3>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Autorizada el {formatDate(referencia.fecha_autorizacion)}
                </p>
              </div>
            </div>
          </div>

          {/* Información del Paciente */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <User className="w-3.5 h-3.5" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Nombre</span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_paciente}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Nómina</span>
                <p className={`font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.no_nomina}</p>
              </div>
            </div>
          </div>

          {/* Datos de la Referencia */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <FileText className="w-3.5 h-3.5" />
              Datos de la Referencia
            </h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Médico que refiere</span>
                  <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_medico_refiere}</p>
                </div>
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Especialidad solicitada</span>
                  <p className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_especialidad}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-dashed dark:border-gray-700/50 border-gray-200">
                <span className={`text-xs block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Motivo de referencia</span>
                <p className={`text-sm italic leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}>{referencia.motivo_referencia}</p>
              </div>
            </div>
          </div>

          {/* Asignación por Hospital */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-[#0f83b2]/10 border-[#0f83b2]/30" : "bg-blue-50 border-blue-100"}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-[#0db1ec]" : "text-blue-700"}`}>
              <Calendar className="w-3.5 h-3.5" />
              Asignación por Hospital
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Médico especialista</span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_medico_asignado || "N/A"}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Fecha de cita</span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{formatDate(referencia.fecha_cita)}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Asignado por</span>
                <p className={`${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_usuario_asigna || "N/A"}</p>
              </div>
              <div>
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Fecha de asignación</span>
                <p className={`${isDark ? "text-white" : "text-gray-900"}`}>{formatDate(referencia.fecha_asignacion)}</p>
              </div>
            </div>
          </div>

          {/* Autorización por Coordinador */}
          <div className={`p-4 rounded-xl border ${isDark ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-green-300" : "text-green-700"}`}>
              <CheckCircle className="w-3.5 h-3.5" />
              Autorización por Coordinador
            </h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Coordinador</span>
                  <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_coordinador || "N/A"}</p>
                </div>
                <div>
                  <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Fecha de autorización</span>
                  <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{formatDate(referencia.fecha_autorizacion)}</p>
                </div>
              </div>
              {referencia.observaciones_coordinador && (
                <div className="pt-2 border-t border-dashed dark:border-green-500/30 border-green-200">
                  <span className={`text-xs block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Observaciones</span>
                  <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.observaciones_coordinador}</p>
                </div>
              )}
              {referencia.firma_digital && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs block ${isDark ? "text-gray-500" : "text-gray-400"}`}>Firma digital</span>
                    <button
                      onClick={() => setMostrarFirma(!mostrarFirma)}
                      className={`text-xs px-3 py-1 rounded-lg transition-colors font-medium ${isDark
                        ? "bg-[#0f83b2]/20 hover:bg-[#0f83b2]/30 text-[#0db1ec]"
                        : "bg-[#0f83b2]/10 hover:bg-[#0f83b2]/20 text-[#0f83b2]"
                        }`}
                    >
                      {mostrarFirma ? "Ocultar" : "Mostrar"} firma
                    </button>
                  </div>
                  {mostrarFirma && obtenerFirmaBase64(referencia.firma_digital) && (
                    <div className={`p-3 rounded-lg border ${isDark ? "bg-white border-gray-300" : "bg-white border-gray-200"}`}>
                      <img
                        src={obtenerFirmaBase64(referencia.firma_digital)!}
                        alt="Firma digital"
                        className="max-h-32 mx-auto"
                        onError={(e) => {
                          console.error('Error al cargar firma:', referencia.firma_digital);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notificación (si aplica) */}
          {(referencia.estatus === "notificada" || referencia.estatus === "atendida") && (
            <div className={`p-4 rounded-xl border ${isDark ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                <Send className="w-3.5 h-3.5" />
                Notificación al Paciente
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Notificado por</span>
                    <p className={`${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_usuario_notifica || "N/A"}</p>
                  </div>
                  <div>
                    <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Fecha de notificación</span>
                    <p className={`${isDark ? "text-white" : "text-gray-900"}`}>{formatDate(referencia.fecha_notificacion)}</p>
                  </div>
                </div>
                {referencia.observaciones_notificacion && (
                  <div className="pt-2 border-t border-dashed dark:border-blue-500/30 border-blue-200">
                    <span className={`text-xs block mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Observaciones</span>
                    <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.observaciones_notificacion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Atención (si aplica) */}
          {referencia.estatus === "atendida" && (
            <div className={`p-4 rounded-xl border ${isDark ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200"}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                <UserCheck className="w-3.5 h-3.5" />
                Atención por Especialista
              </h3>
              <div className="text-sm">
                <span className={`text-xs block mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Fecha de atención</span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{formatDate(referencia.fecha_atencion)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t shrink-0 ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/30" : "bg-gray-50/50 border-gray-200"}`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
