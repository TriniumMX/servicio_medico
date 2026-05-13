'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Package, AlertTriangle } from 'lucide-react';

interface Props {
    data: {
        stockStatus: Array<{ name: string; value: number }>;
        criticos: Array<{ nombre: string; sustancia: string; clasificacion: string; existencia: number; fondoFijo: number; porcentaje: number }>;
        clasificacion: Array<{ name: string; total: number; valor: number }>;
        resumen: { totalItems: number; totalPiezas: number; valorTotal: number };
    };
}

const STOCK_COLORS: Record<string, string> = {
    CRITICO: '#ef4444',
    BAJO: '#f59e0b',
    MEDIO: '#3b82f6',
    NORMAL: '#10b981',
};

const CLASIF_COLORS: Record<string, string> = {
    GENERICO: '#10b981',
    PATENTE: '#3b82f6',
    CONTROLADO: '#ef4444',
};

export default function InventarioChart({ data }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const isDark = resolvedTheme === 'dark';

    const totalStock = data.stockStatus.reduce((s, e) => s + e.value, 0);
    const criticos = data.stockStatus.find(s => s.name === 'CRITICO')?.value || 0;
    const bajos = data.stockStatus.find(s => s.name === 'BAJO')?.value || 0;

    return (
        <div className={`backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-lg border ${isDark ? 'bg-slate-800/90 border-slate-600/50' : 'bg-white/90 border-slate-200/50'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                        <Package className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Inventario de Medicamentos</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{data.resumen.totalItems} medicamentos activos</p>
                    </div>
                </div>
                {(criticos + bajos) > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500">
                        <AlertTriangle size={14} />
                        <span className="text-xs font-bold">{criticos + bajos} requieren atención</span>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {data.stockStatus.map((s) => (
                    <div key={s.name} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS[s.name] }} />
                            <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.name}</p>
                        </div>
                        <p className={`text-2xl font-black tabular-nums`} style={{ color: STOCK_COLORS[s.name] }}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Críticos - Tabla visual */}
                <div className="lg:col-span-2">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Medicamentos Más Críticos</p>
                    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className={`grid grid-cols-[1fr_80px_80px_70px] gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                            <span>Medicamento</span>
                            <span className="text-center">Existencia</span>
                            <span className="text-center">Fondo Fijo</span>
                            <span className="text-right">%</span>
                        </div>
                        {data.criticos.slice(0, 8).map((med, i) => {
                            const color = med.porcentaje <= 10 ? 'text-red-500' : med.porcentaje <= 30 ? 'text-amber-500' : 'text-blue-500';
                            const bg = med.porcentaje <= 10 ? (isDark ? 'bg-red-500/5' : 'bg-red-50/50') : '';
                            return (
                                <div key={i} className={`grid grid-cols-[1fr_80px_80px_70px] gap-2 px-3 py-2 text-sm items-center border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'} ${bg}`}>
                                    <div className="min-w-0">
                                        <p className={`font-medium truncate text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{med.nombre}</p>
                                    </div>
                                    <p className={`text-center font-bold tabular-nums text-xs ${color}`}>{med.existencia}</p>
                                    <p className={`text-center tabular-nums text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{med.fondoFijo}</p>
                                    <p className={`text-right font-bold tabular-nums text-xs ${color}`}>{med.porcentaje}%</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Distribución por Clasificación */}
                <div className="flex flex-col">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Por Clasificación</p>
                    <div className="flex-1 relative h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.clasificacion} innerRadius="50%" outerRadius="80%" paddingAngle={3} dataKey="total" strokeWidth={0}>
                                    {data.clasificacion.map((e, i) => (
                                        <Cell key={i} fill={CLASIF_COLORS[e.name] || '#64748b'} opacity={0.85} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, n: any, p: any) => [`${v} items`, p.payload.name]} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 12, color: isDark ? '#fff' : '#000' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 mt-2">
                        {data.clasificacion.map((c, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLASIF_COLORS[c.name] || '#64748b' }} />
                                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{c.name}</span>
                                </span>
                                <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.total}</span>
                            </div>
                        ))}
                    </div>
                    {/* Valor Total */}
                    <div className={`mt-4 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Valor Total Inventario</p>
                        <p className="text-xl font-black tabular-nums bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            ${data.resumen.valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
