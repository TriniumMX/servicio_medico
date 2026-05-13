//src/app/dashboard/referencias/especialista/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { RefreshCw, Stethoscope, AlertCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import type { ReferenciaEspecialidad } from "@/types/referencias";
import TablaReferenciasEspecialista from "@/components/referencias/especialista/TablaReferenciasEspecialista";
import ModalDetalleReferencia from "@/components/referencias/especialista/ModalDetalleReferencia";
import ModalCrearContrareferencia from "@/components/contrareferencias/ModalCrearContrareferencia";
import ModalSignosVitalesReferencia from "@/components/referencias/especialista/ModalSignosVitalesReferencia";
import ModalInasistencia from "@/components/referencias/especialista/ModalInasistencia";
import ModalAccionPostConsulta from "@/components/referencias/especialista/ModalAccionPostConsulta";

type FiltroReferencias = "pendientes" | "atendidas" | "inasistencias" | "todas";


export default function EspecialistaReferenciasPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [referencias, setReferencias] = useState<ReferenciaEspecialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroReferencias>("pendientes");

  // Modal de detalle
  const [modalOpen, setModalOpen] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] =
    useState<ReferenciaEspecialidad | null>(null);

  // Modal de contrareferencia
  const [modalContrarreferirOpen, setModalContrarreferirOpen] = useState(false);
  const [referenciaParaContrareferir, setReferenciaParaContrareferir] =
    useState<ReferenciaEspecialidad | null>(null);

  // Modal de signos vitales (flujo especialista)
  const [modalSignosVitalesOpen, setModalSignosVitalesOpen] = useState(false);

  // Modal de inasistencia
  const [modalInasistenciaOpen, setModalInasistenciaOpen] = useState(false);
  const [referenciaParaInasistencia, setReferenciaParaInasistencia] =
    useState<ReferenciaEspecialidad | null>(null);

  // Modal para Acciones Post Consulta (Seguimiento tardío)
  const [modalAccionPostConsultaOpen, setModalAccionPostConsultaOpen] = useState(false);
  const [referenciaParaAccionPostConsulta, setReferenciaParaAccionPostConsulta] =
    useState<ReferenciaEspecialidad | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarReferencias();
    }
  }, [mounted, filtro]);

  const isDark = mounted && theme === "dark";

  const cargarReferencias = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/referencias/especialista/mis-referencias?filtro=${filtro}`
      );
      const data = await response.json();

      if (data.success) {
        setReferencias(data.referencias || []);
      } else {
        setError(data.error || "Error al cargar referencias");
      }
    } catch (error) {
      console.error("Error al cargar referencias:", error);
      setError("Error de conexión al cargar referencias");
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (referencia: ReferenciaEspecialidad) => {
    setReferenciaSeleccionada(referencia);
    setModalOpen(true);
  };

  const handleAtender = () => {
    if (!referenciaSeleccionada) return;
    // Cerrar el modal de detalle y abrir el de signos vitales con el paciente bloqueado
    setModalOpen(false);
    setModalSignosVitalesOpen(true);
  };

  const handleMarcarInasistencia = (referencia: ReferenciaEspecialidad) => {
    setReferenciaParaInasistencia(referencia);
    setModalInasistenciaOpen(true);
  };

  const handleInasistenciaRegistrada = async () => {
    toast.success("Inasistencia registrada", {
      description: "La referencia fue marcada como inasistencia. Se generó la constancia.",
    });
    await cargarReferencias();
  };

  const handleContrareferir = (referencia: ReferenciaEspecialidad) => {
    setReferenciaParaContrareferir(referencia);
    setModalContrarreferirOpen(true);
  };

  const handleSolicitarSeguimiento = (referencia: ReferenciaEspecialidad) => {
    setReferenciaParaAccionPostConsulta(referencia);
    setModalAccionPostConsultaOpen(true);
  };

  const handleCrearContrareferencia = async (data: {
    id_referencia: number;
    observaciones_especialista?: string;
  }) => {
    try {
      const response = await fetch("/api/contrareferencias/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Contrareferencia creada exitosamente", {
          description: `Folio: ${result.data.folio}`,
        });
        setModalContrarreferirOpen(false);
        setReferenciaParaContrareferir(null);
        // Recargar referencias para actualizar el estado
        await cargarReferencias();
      } else {
        toast.error("Error al crear contrareferencia", {
          description: result.error || "Error desconocido",
        });
      }
    } catch (error) {
      console.error("Error al crear contrareferencia:", error);
      toast.error("Error de conexión", {
        description: "No se pudo crear la contrareferencia",
      });
    }
  };

  const getContadorTexto = () => {
    const count = referencias.length;
    if (filtro === "pendientes") {
      return `${count} ${count === 1 ? "referencia pendiente" : "referencias pendientes"}`;
    } else if (filtro === "atendidas") {
      return `${count} ${count === 1 ? "referencia atendida" : "referencias atendidas"}`;
    } else if (filtro === "inasistencias") {
      return `${count} ${count === 1 ? "inasistencia registrada" : "inasistencias registradas"}`;
    } else {
      return `${count} ${count === 1 ? "referencia total" : "referencias totales"}`;
    }
  };

  if (!mounted) {
    return null;
  }

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
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-800"
                  }`}
              >
                Mis Referencias
              </h1>
              <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Especialista - Gestionar pacientes referidos
              </p>
            </div>
          </div>

          <button
            onClick={cargarReferencias}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isDark
              ? "bg-[#0f83b2] hover:bg-[#0db1ec] text-white"
              : "bg-[#0f83b2] hover:bg-[#0a7aa0] text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter
              className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"
                }`}
            />
            <span
              className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"
                }`}
            >
              Filtrar:
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro("pendientes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === "pendientes"
                ? isDark
                  ? "bg-blue-500 text-white"
                  : "bg-blue-600 text-white"
                : isDark
                  ? "bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltro("atendidas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === "atendidas"
                ? isDark
                  ? "bg-green-500 text-white"
                  : "bg-green-600 text-white"
                : isDark
                  ? "bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
            >
              Atendidas
            </button>
            <button
              onClick={() => setFiltro("inasistencias")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === "inasistencias"
                ? isDark
                  ? "bg-red-500 text-white"
                  : "bg-red-600 text-white"
                : isDark
                  ? "bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
            >
              Inasistencias
            </button>
            <button
              onClick={() => setFiltro("todas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === "todas"
                ? isDark
                  ? "bg-purple-500 text-white"
                  : "bg-purple-600 text-white"
                : isDark
                  ? "bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
            >
              Todas
            </button>
          </div>
        </div>

        {/* Contador */}
        <div className="mt-3">
          <div
            className={`inline-block px-4 py-2 rounded-lg ${
              filtro === "pendientes"
                ? isDark ? "bg-blue-500/20" : "bg-blue-50"
                : filtro === "atendidas"
                  ? isDark ? "bg-green-500/20" : "bg-green-50"
                  : filtro === "inasistencias"
                    ? isDark ? "bg-red-500/20" : "bg-red-50"
                    : isDark ? "bg-purple-500/20" : "bg-purple-50"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                filtro === "pendientes"
                  ? isDark ? "text-blue-300" : "text-blue-700"
                  : filtro === "atendidas"
                    ? isDark ? "text-green-300" : "text-green-700"
                    : filtro === "inasistencias"
                      ? isDark ? "text-red-300" : "text-red-700"
                      : isDark ? "text-purple-300" : "text-purple-700"
              }`}
            >
              {getContadorTexto()}
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className={`rounded-xl shadow-lg p-6 border-2 ${isDark
            ? "bg-red-500/10 border-red-500/30"
            : "bg-red-50 border-red-200"
            }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3
                className={`font-bold ${isDark ? "text-red-300" : "text-red-700"
                  }`}
              >
                Error
              </h3>
              <p
                className={`text-sm ${isDark ? "text-red-400" : "text-red-600"
                  }`}
              >
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de referencias */}
      {loading ? (
        <div
          className={`rounded-xl shadow-lg p-12 text-center ${isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
            }`}
        >
          <div
            className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
              }`}
          ></div>
          <p
            className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"
              }`}
          >
            Cargando referencias...
          </p>
        </div>
      ) : referencias.length === 0 ? (
        <div
          className={`rounded-xl shadow-lg p-12 text-center ${isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
            }`}
        >
          <Stethoscope
            className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"
              }`}
          />
          <h3
            className={`text-xl font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-600"
              }`}
          >
            {filtro === "pendientes"
              ? "No tienes referencias pendientes"
              : filtro === "atendidas"
                ? "No tienes referencias atendidas"
                : filtro === "inasistencias"
                  ? "No tienes inasistencias registradas"
                  : "No tienes referencias asignadas"}
          </h3>
          <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
            {filtro === "pendientes"
              ? "Las nuevas referencias aparecerán aquí"
              : filtro === "inasistencias"
                ? "Las inasistencias que registres aparecerán aquí"
                : "Cambia el filtro para ver otras referencias"}
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl shadow-lg overflow-hidden ${isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
            }`}
        >
          <TablaReferenciasEspecialista
            referencias={referencias}
            onVerDetalle={handleVerDetalle}
            onContrareferir={handleContrareferir}
            onSolicitarSeguimiento={handleSolicitarSeguimiento}
            onMarcarInasistencia={handleMarcarInasistencia}
            isDark={isDark}
          />
        </div>
      )}

      {/* Modal de detalle */}
      <ModalDetalleReferencia
        referencia={referenciaSeleccionada}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReferenciaSeleccionada(null);
        }}
        onAtender={handleAtender}
        isDark={isDark}
      />

      {/* Modal de crear contrareferencia */}
      <ModalCrearContrareferencia
        referencia={referenciaParaContrareferir}
        isOpen={modalContrarreferirOpen}
        onClose={() => {
          setModalContrarreferirOpen(false);
          setReferenciaParaContrareferir(null);
        }}
        onCreate={handleCrearContrareferencia}
        isDark={isDark}
      />

      {/* Modal de signos vitales con paciente bloqueado → redirige a diagnóstico */}
      <ModalSignosVitalesReferencia
        referencia={referenciaSeleccionada}
        isOpen={modalSignosVitalesOpen}
        onClose={() => {
          setModalSignosVitalesOpen(false);
        }}
        isDark={isDark}
      />

      {/* Modal de inasistencia */}
      <ModalInasistencia
        referencia={referenciaParaInasistencia}
        isOpen={modalInasistenciaOpen}
        onClose={() => {
          setModalInasistenciaOpen(false);
          setReferenciaParaInasistencia(null);
        }}
        onInasistenciaRegistrada={handleInasistenciaRegistrada}
        isDark={isDark}
      />

      {/* Modal Acciones Post Consulta (Seguimiento Tardío) */}
      {referenciaParaAccionPostConsulta && (
        <ModalAccionPostConsulta
          isOpen={modalAccionPostConsultaOpen}
          onClose={() => {
            setModalAccionPostConsultaOpen(false);
            setReferenciaParaAccionPostConsulta(null);
            cargarReferencias();
          }}
          onSuccessRedirect={() => {
            toast.success("Seguimiento solicitado exitosamente");
            setModalAccionPostConsultaOpen(false);
            setReferenciaParaAccionPostConsulta(null);
            cargarReferencias();
          }}
          idReferenciaOrigen={referenciaParaAccionPostConsulta.id_referencia}
          idConsultaEspecialista={referenciaParaAccionPostConsulta.id_consulta || 0}
          isDark={isDark}
        />
      )}
    </div>
  );
}
