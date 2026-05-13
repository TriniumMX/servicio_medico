"use client";

import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, XCircle, Calendar, AlertTriangle, FileText, User, AlertCircle } from "lucide-react";

interface ModalDecisionProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: "AUTORIZAR" | "RECHAZAR";
  data: {
    id_incapacidad: number;
    nombre_paciente: string;
    fecha_inicio: string;
    fecha_fin: string;
    dias_sugeridos: number;
    motivo_medico?: string;
  };
  onConfirm: (datos: any) => void;
  isDark?: boolean;
}

export default function ModalDecision({ isOpen, onClose, tipo, data, onConfirm, isDark = false }: ModalDecisionProps) {
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [diasCalculados, setDiasCalculados] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const inputInicioRef = useRef<HTMLInputElement>(null);
  const inputFinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && data) {
      const inicio = new Date(data.fecha_inicio).toISOString().split('T')[0];
      const fin = new Date(data.fecha_fin).toISOString().split('T')[0];
      setFechaInicio(inicio);
      setFechaFin(fin);
      setDiasCalculados(data.dias_sugeridos);
      setMotivoRechazo("");
      setErrorMsg("");
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const d1 = new Date(fechaInicio);
      const d2 = new Date(fechaFin);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDiasCalculados(diffDays > 0 ? diffDays : 0);
    }
  }, [fechaInicio, fechaFin]);

  if (!isOpen || !data) return null;

  const handleSubmit = () => {
    if (tipo === "RECHAZAR" && !motivoRechazo.trim()) {
      setErrorMsg("Debes escribir un motivo para rechazar.");
      return;
    }
    if (tipo === "AUTORIZAR" && diasCalculados <= 0) {
      setErrorMsg("Los días autorizados deben ser mayor a 0.");
      return;
    }
    setErrorMsg("");

    onConfirm({
      id_incapacidad: data.id_incapacidad,
      accion: tipo,
      motivo: tipo === "RECHAZAR" ? motivoRechazo : null,
      nuevos_datos: tipo === "AUTORIZAR" ? {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        dias: diasCalculados
      } : null
    });
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.showPicker();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className={`w-full max-w-md sm:max-w-lg rounded-2xl shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-200 ${
        isDark
          ? "bg-[#0a1929] border border-[#0f83b2]/30"
          : "bg-white shadow-xl"
      }`}>

        {/* Header */}
        <div className={`px-4 sm:px-6 py-4 flex justify-between items-center border-b ${
          tipo === "AUTORIZAR"
            ? isDark
              ? "border-green-500/20 bg-gradient-to-r from-green-500/10 to-green-600/5"
              : "border-green-100 bg-gradient-to-r from-green-50 to-emerald-50"
            : isDark
              ? "border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-600/5"
              : "border-red-100 bg-gradient-to-r from-red-50 to-rose-50"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              tipo === "AUTORIZAR"
                ? isDark
                  ? "bg-green-500/20 text-green-400"
                  : "bg-green-100 text-green-600"
                : isDark
                  ? "bg-red-500/20 text-red-400"
                  : "bg-red-100 text-red-600"
            }`}>
              {tipo === "AUTORIZAR" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-bold ${
                tipo === "AUTORIZAR"
                  ? isDark ? "text-green-400" : "text-green-700"
                  : isDark ? "text-red-400" : "text-red-700"
              }`}>
                {tipo === "AUTORIZAR" ? "Autorizar Incapacidad" : "Rechazar Incapacidad"}
              </h3>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {tipo === "AUTORIZAR" ? "Verifique los datos antes de confirmar" : "Indique el motivo del rechazo"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${
              isDark
                ? "hover:bg-white/10 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">

          {/* Motivo de la Incapacidad */}
          {data.motivo_medico && (
            <div className={`p-4 rounded-xl border ${
              isDark
                ? "bg-[#0d2137] border-[#0f83b2]/20"
                : "bg-blue-50/80 border-blue-100"
            }`}>
              <div className="flex gap-3">
                <div className={`shrink-0 p-2 rounded-lg ${
                  isDark
                    ? "bg-[#0f83b2]/20 text-[#0db1ec]"
                    : "bg-blue-100 text-blue-600"
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                    isDark ? "text-gray-400" : "text-blue-600/70"
                  }`}>
                    Motivo de la Incapacidad
                  </p>
                  <p className={`text-sm leading-relaxed ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}>
                    {data.motivo_medico}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Paciente */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            isDark
              ? "bg-[#0d1f2d] border-[#0f83b2]/20"
              : "bg-gray-50 border-gray-100"
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              isDark
                ? "bg-[#0f83b2]/20 text-[#0db1ec]"
                : "bg-blue-100 text-blue-600"
            }`}>
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}>
                Paciente
              </p>
              <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                {data.nombre_paciente}
              </p>
            </div>
          </div>

          {tipo === "AUTORIZAR" ? (
            <div className="space-y-4">
              {/* Aviso */}
              <div className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-amber-50 border-amber-100"
              }`}>
                <p className={`text-xs sm:text-sm flex items-start gap-2 ${
                  isDark ? "text-amber-300" : "text-amber-700"
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Puede ajustar las fechas si el criterio médico lo requiere.</span>
                </p>
              </div>

              {/* Campos de fecha - Responsivos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fecha Inicio */}
                <div
                  onClick={() => openDatePicker(inputInicioRef)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                    isDark
                      ? "bg-[#0d2137] border-[#0f83b2]/30 hover:border-[#0f83b2]"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? "bg-[#0f83b2]/20 text-[#0db1ec] group-hover:bg-[#0f83b2]/30"
                        : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}>
                        Fecha Inicio
                      </p>
                      <p className={`text-sm font-semibold truncate ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}>
                        {formatDateDisplay(fechaInicio)}
                      </p>
                    </div>
                  </div>
                  <input
                    ref={inputInicioRef}
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="sr-only"
                  />
                </div>

                {/* Fecha Fin */}
                <div
                  onClick={() => openDatePicker(inputFinRef)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                    isDark
                      ? "bg-[#0d2137] border-[#0f83b2]/30 hover:border-[#0f83b2]"
                      : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? "bg-[#0f83b2]/20 text-[#0db1ec] group-hover:bg-[#0f83b2]/30"
                        : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}>
                        Fecha Fin
                      </p>
                      <p className={`text-sm font-semibold truncate ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}>
                        {formatDateDisplay(fechaFin)}
                      </p>
                    </div>
                  </div>
                  <input
                    ref={inputFinRef}
                    type="date"
                    value={fechaFin}
                    min={fechaInicio}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>

              {/* Total Días */}
              <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-xl border ${
                isDark
                  ? "bg-gradient-to-r from-[#0f83b2]/10 to-[#0db1ec]/5 border-[#0f83b2]/30"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
              }`}>
                <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Total Días a Autorizar
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl sm:text-4xl font-bold ${isDark ? "text-[#0db1ec]" : "text-blue-600"}`}>
                    {diasCalculados}
                  </span>
                  <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    días
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Textarea para Rechazo */
            <div>
              <label className={`block text-sm font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Motivo del Rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Describa la razón por la cual no procede la incapacidad..."
                className={`w-full p-4 rounded-xl border outline-none resize-none transition-all ${
                  isDark
                    ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20"
                }`}
              />
            </div>
          )}
        </div>

        {/* Error inline */}
        {errorMsg && (
          <div className={`mx-4 sm:mx-6 mb-0 -mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
            ${isDark ? 'bg-red-900/30 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Footer - Responsivo */}
        <div className={`p-4 sm:p-6 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-3 ${
          isDark
            ? "border-[#0f83b2]/20 bg-[#050b14]/50"
            : "border-gray-100 bg-gray-50/80"
        }`}>
          <button
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold transition-all ${
              isDark
                ? "text-gray-300 hover:bg-white/5 border border-gray-700"
                : "text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              tipo === "AUTORIZAR"
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/25"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25"
            }`}
          >
            {tipo === "AUTORIZAR" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar Autorización</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Confirmar Rechazo</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
