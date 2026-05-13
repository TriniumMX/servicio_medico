import { useState } from "react";
import { X, ArrowLeftCircle, User, FileText, AlertCircle, CheckCircle } from "lucide-react";
import type { ReferenciaEspecialidad } from "@/types/referencias";

interface Props {
  referencia: ReferenciaEspecialidad | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { id_referencia: number; observaciones_especialista?: string }) => Promise<void>;
  isDark: boolean;
}

export default function ModalCrearContrareferencia({
  referencia,
  isOpen,
  onClose,
  onCreate,
  isDark
}: Props) {
  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !referencia) return null;

  const handleCrear = async () => {
    setSubmitting(true);
    try {
      await onCreate({
        id_referencia: referencia.id_referencia,
        observaciones_especialista: observaciones.trim() || undefined
      });
      // Limpiar estado después de crear
      setObservaciones("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${isDark ? "bg-[#0a1929]" : "bg-white"} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? "bg-[#0a1929] border-[#0f83b2]/30" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <ArrowLeftCircle className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                Crear Contrareferencia
              </h2>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Devolver paciente al médico que lo refirió
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
          >
            <X className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información del Paciente */}
          <div className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
            <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <User className="w-4 h-4" />
              Información del Paciente
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Nombre:</span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_paciente}</p>
              </div>
              <div>
                <span className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Nómina:</span>
                <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{referencia.no_nomina}</p>
              </div>
            </div>
          </div>

          {/* Datos de la Referencia Original */}
          <div className={`p-4 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
            <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <FileText className="w-4 h-4" />
              Médico que lo Refirió
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Médico:</span>
                <p className={`${isDark ? "text-white" : "text-gray-900"}`}>{referencia.nombre_medico_refiere}</p>
              </div>
              <div>
                <span className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>Motivo de referencia original:</span>
                <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{referencia.motivo_referencia}</p>
              </div>
            </div>
          </div>

          {/* Información Automática */}
          <div className={`p-4 rounded-lg border ${isDark ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
              <div className="space-y-2">
                <h3 className={`text-sm font-bold ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                  Información Importante
                </h3>
                <ul className={`text-sm space-y-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  <li>• El SOAP completo de tu consulta será enviado automáticamente</li>
                  <li>• La contrareferencia llegará directamente al Dr(a). {referencia.nombre_medico_refiere}</li>
                  <li>• El médico recibirá una notificación en tiempo real</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Observaciones Adicionales */}
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Observaciones Adicionales (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Agregue comentarios o recomendaciones adicionales para el médico que lo refirió..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border transition-colors resize-none ${
                isDark
                  ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-purple-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
            />
            <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
              Estas observaciones se agregarán al SOAP completo que se enviará
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              } disabled:opacity-50`}
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              disabled={submitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDark
                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              } disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Crear Contrareferencia
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
