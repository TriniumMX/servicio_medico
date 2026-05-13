//src/app/dashboard/contrareferencias/mis-contrareferencias/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { RefreshCw, ArrowLeftCircle, AlertCircle, Filter } from "lucide-react";
import type { Contrareferencia, FiltroContrareferencias } from "@/types/contrareferencias";
import TablaContrareferencias from "@/components/contrareferencias/TablaContrareferencias";

export default function MisContrareferenciasPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [contrareferencias, setContrareferencias] = useState<Contrareferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroContrareferencias>("pendientes");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarContrareferencias();
    }
  }, [mounted, filtro]);

  const isDark = mounted && theme === "dark";

  const cargarContrareferencias = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/contrareferencias/mis-contrareferencias?filtro=${filtro}`
      );
      const data = await response.json();

      if (data.success) {
        setContrareferencias(data.contrareferencias || []);
      } else {
        setError(data.error || "Error al cargar contrareferencias");
      }
    } catch (error) {
      console.error("Error al cargar contrareferencias:", error);
      setError("Error de conexión al cargar contrareferencias");
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (contrareferencia: Contrareferencia) => {
    router.push(
      `/dashboard/contrareferencias/detalle/${contrareferencia.id_contrareferencia}`
    );
  };

  const getContadorTexto = () => {
    const count = contrareferencias.length;
    if (filtro === "pendientes") {
      return `${count} ${count === 1 ? "contrareferencia pendiente" : "contrareferencias pendientes"}`;
    } else if (filtro === "vistas") {
      return `${count} ${count === 1 ? "contrareferencia vista" : "contrareferencias vistas"}`;
    } else {
      return `${count} ${count === 1 ? "contrareferencia total" : "contrareferencias totales"}`;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div
        className={`rounded-xl shadow-lg p-6 ${
          isDark
            ? "bg-[#0a1929] border border-[#0f83b2]/20"
            : "bg-white border border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
              <ArrowLeftCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className={`text-3xl font-bold ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                Mis Contrareferencias
              </h1>
              <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Pacientes devueltos por especialistas
              </p>
            </div>
          </div>

          <button
            onClick={cargarContrareferencias}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
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
              className={`w-5 h-5 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Filtrar:
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro("pendientes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === "pendientes"
                  ? isDark
                    ? "bg-yellow-500 text-white"
                    : "bg-yellow-600 text-white"
                  : isDark
                    ? "bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setFiltro("vistas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === "vistas"
                  ? isDark
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600 text-white"
                  : isDark
                    ? "bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Vistas
            </button>
            <button
              onClick={() => setFiltro("todas")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === "todas"
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
                ? isDark
                  ? "bg-yellow-500/20"
                  : "bg-yellow-50"
                : filtro === "vistas"
                  ? isDark
                    ? "bg-blue-500/20"
                    : "bg-blue-50"
                  : isDark
                    ? "bg-purple-500/20"
                    : "bg-purple-50"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                filtro === "pendientes"
                  ? isDark
                    ? "text-yellow-300"
                    : "text-yellow-700"
                  : filtro === "vistas"
                    ? isDark
                      ? "text-blue-300"
                      : "text-blue-700"
                    : isDark
                      ? "text-purple-300"
                      : "text-purple-700"
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
          className={`rounded-xl shadow-lg p-6 border-2 ${
            isDark
              ? "bg-red-500/10 border-red-500/30"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3
                className={`font-bold ${
                  isDark ? "text-red-300" : "text-red-700"
                }`}
              >
                Error
              </h3>
              <p
                className={`text-sm ${
                  isDark ? "text-red-400" : "text-red-600"
                }`}
              >
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de contrareferencias */}
      {loading ? (
        <div
          className={`rounded-xl shadow-lg p-12 text-center ${
            isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
          }`}
        >
          <div
            className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${
              isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
            }`}
          ></div>
          <p
            className={`mt-4 font-medium ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Cargando contrareferencias...
          </p>
        </div>
      ) : contrareferencias.length === 0 ? (
        <div
          className={`rounded-xl shadow-lg p-12 text-center ${
            isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
          }`}
        >
          <ArrowLeftCircle
            className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? "text-gray-600" : "text-gray-300"
            }`}
          />
          <h3
            className={`text-xl font-bold mb-2 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {filtro === "pendientes"
              ? "No tienes contrareferencias pendientes"
              : filtro === "vistas"
                ? "No tienes contrareferencias vistas"
                : "No tienes contrareferencias"}
          </h3>
          <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
            {filtro === "pendientes"
              ? "Cuando un especialista te devuelva un paciente, aparecerá aquí"
              : "Cambia el filtro para ver otras contrareferencias"}
          </p>
        </div>
      ) : (
        <div
          className={`rounded-xl shadow-lg overflow-hidden ${
            isDark
              ? "bg-[#0a1929] border border-[#0f83b2]/20"
              : "bg-white border border-gray-200"
          }`}
        >
          <TablaContrareferencias
            contrareferencias={contrareferencias}
            onVerDetalle={handleVerDetalle}
            isDark={isDark}
          />
        </div>
      )}
    </div>
  );
}
