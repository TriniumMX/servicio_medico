'use client';

import { useState, useMemo } from 'react';
import { MedicamentoConCupones, CuponSeleccionado } from '@/types/farmacia/resurtimiento';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, Printer, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

interface TablaCuponesProps {
  medicamentos: MedicamentoConCupones[];
  isDark: boolean;
  onGenerarResurtimiento: (cupones: CuponSeleccionado[]) => void;
  onReimprimirReceta?: (folioReceta: string, idReceta: number) => void;
}

export default function TablaCupones({
  medicamentos,
  isDark,
  onGenerarResurtimiento,
  onReimprimirReceta,
}: TablaCuponesProps) {
  const [cuponesSeleccionados, setCuponesSeleccionados] = useState<Set<number>>(new Set());
  const [mesesExpandidos, setMesesExpandidos] = useState<Set<number>>(new Set([1]));

  // ── Lógica original sin cambios ──────────────────────────────────────────
  const toggleCupon = (idControl: number, disponible: boolean, tieneRecetaGenerada: boolean) => {
    if (!disponible || tieneRecetaGenerada) return;
    const newSet = new Set(cuponesSeleccionados);
    if (newSet.has(idControl)) {
      newSet.delete(idControl);
    } else {
      newSet.add(idControl);
    }
    setCuponesSeleccionados(newSet);
  };

  const seleccionarTodosPendientes = () => {
    const todosDisponibles = new Set<number>();
    medicamentos.forEach((med) => {
      med.cupones.pendientes.forEach((cupon) => {
        const tieneReceta = cupon.receta_resurtimiento !== null && cupon.receta_resurtimiento !== undefined;
        if (cupon.disponible_para_resurtir && !tieneReceta) {
          todosDisponibles.add(cupon.id_control);
        }
      });
    });
    setCuponesSeleccionados(todosDisponibles);
  };

  const limpiarSeleccion = () => {
    setCuponesSeleccionados(new Set());
  };

  const handleGenerarResurtimiento = () => {
    const cupones: CuponSeleccionado[] = [];
    medicamentos.forEach((med) => {
      med.cupones.pendientes.forEach((cupon) => {
        if (cuponesSeleccionados.has(cupon.id_control)) {
          cupones.push({
            id_control: cupon.id_control,
            id_detalle: cupon.id_detalle,
            numero_resurtimiento: cupon.numero_resurtimiento,
            medicamento: med.medicamento,
            prescripcion: med.prescripcion,
          });
        }
      });
    });
    onGenerarResurtimiento(cupones);
  };

  // ── Agrupar por mes (nueva lógica de UI) ─────────────────────────────────
  const mesesAgrupados = useMemo(() => {
    const map = new Map<number, {
      numero_resurtimiento: number;
      items: Array<{ med: MedicamentoConCupones; cupon: MedicamentoConCupones['cupones']['pendientes'][0] }>;
    }>();

    medicamentos.forEach((med) => {
      med.cupones.pendientes.forEach((cupon) => {
        const mes = cupon.numero_resurtimiento;
        if (!map.has(mes)) {
          map.set(mes, { numero_resurtimiento: mes, items: [] });
        }
        map.get(mes)!.items.push({ med, cupon });
      });
    });

    return Array.from(map.values()).sort((a, b) => a.numero_resurtimiento - b.numero_resurtimiento);
  }, [medicamentos]);

  // Selecciona/deselecciona TODOS los cupones de un mes
  const toggleMes = (mesNum: number) => {
    const grupo = mesesAgrupados.find((g) => g.numero_resurtimiento === mesNum);
    if (!grupo) return;

    const seleccionables = grupo.items
      .filter(({ cupon }) => {
        const tieneReceta = cupon.receta_resurtimiento !== null && cupon.receta_resurtimiento !== undefined;
        return cupon.disponible_para_resurtir && !tieneReceta;
      })
      .map(({ cupon }) => cupon.id_control);

    if (seleccionables.length === 0) return;

    const todosSeleccionados = seleccionables.every((id) => cuponesSeleccionados.has(id));
    const newSet = new Set(cuponesSeleccionados);
    if (todosSeleccionados) {
      seleccionables.forEach((id) => newSet.delete(id));
    } else {
      seleccionables.forEach((id) => newSet.add(id));
    }
    setCuponesSeleccionados(newSet);
  };

  const toggleExpansion = (mesNum: number) => {
    const newSet = new Set(mesesExpandidos);
    if (newSet.has(mesNum)) {
      newSet.delete(mesNum);
    } else {
      newSet.add(mesNum);
    }
    setMesesExpandidos(newSet);
  };

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Selección de Tratamiento
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Selecciona el <span className="font-semibold">mes</span> que deseas resurtir — todos los medicamentos del mes se incluirán automáticamente
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={seleccionarTodosPendientes}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
              isDark
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
            }`}
          >
            ✓ Seleccionar Todo
          </button>
          <button
            onClick={limpiarSeleccion}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
              isDark
                ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            ✕ Limpiar
          </button>
        </div>
      </div>

      {/* ── Tarjetas por mes ── */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {mesesAgrupados.map((grupo) => {
          const { numero_resurtimiento, items } = grupo;

          const seleccionables = items.filter(({ cupon }) => {
            const tieneReceta = cupon.receta_resurtimiento !== null && cupon.receta_resurtimiento !== undefined;
            return cupon.disponible_para_resurtir && !tieneReceta;
          });

          const todosConReceta = items.every(
            ({ cupon }) => cupon.receta_resurtimiento !== null && cupon.receta_resurtimiento !== undefined,
          );
          const algunoConReceta = items.some(
            ({ cupon }) => cupon.receta_resurtimiento !== null && cupon.receta_resurtimiento !== undefined,
          );
          const bloqueado = seleccionables.length === 0 && !algunoConReceta;
          const todosSeleccionados =
            seleccionables.length > 0 && seleccionables.every(({ cupon }) => cuponesSeleccionados.has(cupon.id_control));

          const isClickable = seleccionables.length > 0;
          const expandido = mesesExpandidos.has(numero_resurtimiento);

          // Fecha representativa (primer cupon disponible o el primero que sea)
          const fechaRef =
            (seleccionables[0]?.cupon ?? items[0]?.cupon)?.fecha_programada ?? '';

          // ── Estilos según estado ──────────────────────────────────────────
          let cardBorder: string;
          let headerBg: string;
          let statusLabel: string;
          let statusBadge: string;

          if (todosConReceta) {
            cardBorder = isDark ? 'border-blue-500/40' : 'border-blue-200';
            headerBg   = isDark ? 'bg-blue-900/20' : 'bg-blue-50';
            statusLabel = 'SURTIDO';
            statusBadge = isDark
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : 'bg-blue-100 text-blue-700 border-blue-200';
          } else if (bloqueado) {
            cardBorder = isDark ? 'border-gray-700 opacity-55' : 'border-gray-200 opacity-55';
            headerBg   = isDark ? 'bg-gray-800/60' : 'bg-gray-100';
            statusLabel = 'BLOQUEADO';
            statusBadge = isDark
              ? 'bg-gray-700 text-gray-400 border-gray-600'
              : 'bg-gray-200 text-gray-500 border-gray-300';
          } else if (todosSeleccionados) {
            cardBorder = isDark
              ? 'border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.25)]'
              : 'border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.18)]';
            headerBg   = isDark ? 'bg-emerald-900/30' : 'bg-emerald-50';
            statusLabel = 'SELECCIONADO';
            statusBadge = isDark
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
              : 'bg-emerald-100 text-emerald-700 border-emerald-300';
          } else {
            cardBorder = isDark
              ? 'border-yellow-500/30 hover:border-yellow-400/70'
              : 'border-yellow-300 hover:border-yellow-400';
            headerBg   = isDark ? 'bg-gray-800/70' : 'bg-yellow-50/60';
            statusLabel = 'DISPONIBLE';
            statusBadge = isDark
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
              : 'bg-yellow-100 text-yellow-700 border-yellow-200';
          }

          return (
            <motion.div
              key={numero_resurtimiento}
              variants={item}
              className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isDark ? 'bg-gray-900/40' : 'bg-white'} ${cardBorder}`}
            >
              {/* ── Encabezado del mes ── */}
              <div
                className={`flex items-center justify-between px-5 py-4 ${headerBg} ${isClickable ? 'cursor-pointer select-none' : 'cursor-default'}`}
                onClick={isClickable ? () => toggleMes(numero_resurtimiento) : undefined}
              >
                {/* Izquierda: indicador + número + badge */}
                <div className="flex items-center gap-3">
                  {/* Indicador visual de selección */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200 ${
                    todosSeleccionados
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : bloqueado
                        ? isDark ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-200 border-gray-300 text-gray-400'
                        : todosConReceta
                          ? isDark ? 'bg-blue-500/30 border-blue-500/50 text-blue-300' : 'bg-blue-100 border-blue-300 text-blue-500'
                          : isDark ? 'bg-gray-700 border-gray-500' : 'bg-white border-gray-300'
                  }`}>
                    {todosSeleccionados ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : bloqueado ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : todosConReceta ? (
                      <Printer className="w-3.5 h-3.5" />
                    ) : (
                      <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {numero_resurtimiento}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        MES {numero_resurtimiento}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {fechaRef && (
                      <div className={`flex items-center gap-1 mt-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <CalendarDays className="w-3 h-3" />
                        <span>{formatearFecha(fechaRef)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Derecha: cantidad de medicamentos + toggle expandir */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {items.length} {items.length === 1 ? 'medicamento' : 'medicamentos'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleExpansion(numero_resurtimiento); }}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  >
                    {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ── Lista de medicamentos (expandible) ── */}
              <AnimatePresence initial={false}>
                {expandido && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                      {items.map(({ med, cupon }) => {
                        const tieneReceta = cupon.receta_resurtimiento !== null && cupon.receta_resurtimiento !== undefined;
                        const fueraVentanaItem = !cupon.disponible_para_resurtir && !tieneReceta;

                        return (
                          <div
                            key={cupon.id_control}
                            className={`flex items-center justify-between px-5 py-3 ${isDark ? 'hover:bg-white/3' : 'hover:bg-gray-50'} transition-colors`}
                          >
                            {/* Info del medicamento */}
                            <div className="flex items-center gap-3">
                              <span className="text-xl select-none">💊</span>
                              <div>
                                <p className={`text-sm font-semibold leading-tight ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {med.medicamento.nombre_comercial}
                                </p>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {med.medicamento.sustancia_activa}
                                  {' · '}
                                  {med.prescripcion.dosis}
                                </p>
                              </div>
                            </div>

                            {/* Derecha: cantidad + estado + acciones */}
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                {med.prescripcion.cantidad_total} pzs/mes
                              </span>

                              {tieneReceta ? (
                                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                  Generada
                                </span>
                              ) : fueraVentanaItem ? (
                                <span className={`text-xs px-2 py-1 rounded-lg font-medium opacity-60 ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                  Bloqueado
                                </span>
                              ) : (
                                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                                  Pendiente
                                </span>
                              )}

                              {tieneReceta && onReimprimirReceta && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReimprimirReceta(
                                      cupon.receta_resurtimiento!.folio,
                                      cupon.receta_resurtimiento!.id_receta,
                                    );
                                  }}
                                  className="flex items-center gap-1 text-[11px] bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded-lg transition-colors font-medium"
                                >
                                  <Printer className="w-3 h-3" />
                                  Imprimir
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hint al pie solo si es seleccionable */}
                    {isClickable && (
                      <div className={`px-5 py-2.5 text-xs text-center border-t ${isDark ? 'text-gray-500 border-white/5' : 'text-gray-400 border-gray-100'}`}>
                        {todosSeleccionados
                          ? 'Haz clic en el encabezado para deseleccionar este mes'
                          : 'Haz clic en el encabezado para seleccionar todos los medicamentos de este mes'}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Floating Action Bar ── */}
      <AnimatePresence>
        {cuponesSeleccionados.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-full px-8 py-4 flex items-center gap-6"
          >
            <div className="flex flex-col">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Seleccionado
              </span>
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {cuponesSeleccionados.size} mes{cuponesSeleccionados.size !== 1 ? 'es' : ''}
              </span>
            </div>
            <button
              onClick={handleGenerarResurtimiento}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transform transition-transform active:scale-95"
            >
              Generar Receta 📄
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
