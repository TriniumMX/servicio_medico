'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Pill, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface Props {
    data: {
        temporal: Array<{
            mes: string;
            total: number;
            surtidas: number;
            parciales: number;
            no_surtidas: number;
            gasto: number;
        }>;
        distribucion: Array<{ name: string; value: number }>;
        resumen: { total: number; surtidas: number; parciales: number; no_surtidas: number };
        topMedicamentos: Array<{ name: string; recetas: number; total_prescrito: number; total_surtido: number }>;
    };
}

const DIST_COLORS: Record<string, string> = {
    'Surtidas': '#10b981',
    'Parciales': '#f59e0b',
    'No Surtidas': '#ef4444',
};

export default function RecetasChart({ data }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const isDark = resolvedTheme === 'dark';

    const textMuted = isDark ? '#64748b' : '#94a3b8';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';

    const totalDist = data.distribucion.reduce((s, e) => s + e.value, 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                <p className="text-xs font-semibold mb-2 opacity-60">{label}</p>
                {payload.map((e: any, i: number) => (
                    <p key={i} className="text-sm flex justify-between gap-4">
                        <span style={{ color: e.color }}>{e.name}</span>
                        <strong>{e.name === 'Gasto' ? `$${Number(e.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : e.value}</strong>
                    </p>
                ))}
            </div>
        );
    };

    const MedTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md max-w-[220px] ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                <p className="text-xs font-semibold mb-1 opacity-60 whitespace-normal break-words">{label}</p>
                {payload.map((e: any, i: number) => (
                    <p key={i} className="text-sm"><span className="opacity-70">{e.name}:</span> <strong>{e.value}</strong></p>
                ))}
            </div>
        );
    };

    return (
        <div className={`backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-lg border ${isDark ? 'bg-slate-800/90 border-slate-600/50' : 'bg-white/90 border-slate-200/50'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Pill className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recetas & Farmacia</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Surtimiento de recetas y consumo de medicamentos</p>
                </div>
            </div>

            {/* KPI mini-cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Recetas</p>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.resumen.total}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>Surtidas</p>
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.resumen.surtidas}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-amber-800/30' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>Parciales</p>
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{data.resumen.parciales}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-red-800/30' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-red-500' : 'text-red-600'}`}>No Surtidas</p>
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-red-400' : 'text-red-600'}`}>{data.resumen.no_surtidas}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tendencia mensual - stacked bar */}
                <div className="lg:col-span-2">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tendencia Mensual</p>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.temporal} margin={{ top: 0, right: 8, left: -10, bottom: 0 }} barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="mes" fontSize={10} axisLine={false} tickLine={false} stroke={textMuted} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke={textMuted} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="surtidas" name="Surtidas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="parciales" name="Parciales" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="no_surtidas" name="No Surtidas" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut distribución */}
                <div className="flex flex-col">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Distribución</p>
                    <div className="flex-1 relative h-[280px]">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="text-center">
                                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalDist}</p>
                                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>recetas</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.distribucion}
                                    innerRadius="52%"
                                    outerRadius="78%"
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {data.distribucion.map((e, i) => (
                                        <Cell key={i} fill={DIST_COLORS[e.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: any, n: any) => [v, n]}
                                    contentStyle={{
                                        backgroundColor: isDark ? '#1e293b' : '#fff',
                                        borderColor: isDark ? '#334155' : '#e2e8f0',
                                        borderRadius: 12,
                                        color: isDark ? '#fff' : '#000'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2">
                        {data.distribucion.map((e, i) => {
                            const pct = totalDist > 0 ? ((e.value / totalDist) * 100).toFixed(0) : 0;
                            return (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DIST_COLORS[e.name] }} />
                                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{e.name}</span>
                                    </span>
                                    <span className={`text-xs font-semibold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {e.value} <span className="opacity-50">({pct}%)</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top medicamentos */}
            {data.topMedicamentos.length > 0 && (
                <div className="mt-6">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top Medicamentos Prescritos</p>
                    <div style={{ height: `${Math.max(240, data.topMedicamentos.length * 32 + 20)}px` }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.topMedicamentos}
                                layout="vertical"
                                margin={{ top: 0, right: 10, left: 4, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} stroke={textMuted} allowDecimals={false} />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={200}
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                    stroke={textMuted}
                                    tick={(props) => {
                                        const { x, y, payload } = props;
                                        const full: string = payload.value;
                                        const label = full.length > 26 ? full.slice(0, 26) + '…' : full;
                                        return (
                                            <text x={x} y={y} dy={4} textAnchor="end" fill={textMuted} fontSize={10}>
                                                <title>{full}</title>
                                                {label}
                                            </text>
                                        );
                                    }}
                                />
                                <Tooltip content={<MedTooltip />} />
                                <Bar dataKey="recetas" name="Recetas" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} opacity={0.85} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
