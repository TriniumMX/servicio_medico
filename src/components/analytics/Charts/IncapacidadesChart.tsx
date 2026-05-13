'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { ShieldAlert, CalendarDays, TrendingDown } from 'lucide-react';

interface Props {
    data: {
        topDiagnosticos: Array<{ name: string; total: number; diasPromedio: number }>;
        resumen: { promedioSugeridos: number; promedioAutorizados: number; totalIncapacidades: number; totalSugeridos: number; totalAutorizados: number };
        porEstatus: Array<{ name: string; value: number }>;
        porDepartamento: Array<{ name: string; total: number; dias: number }>;
    };
}

const STATUS_COLORS: Record<string, string> = {
    AUTORIZADA: '#10b981',
    PENDIENTE: '#f59e0b',
    RECHAZADA: '#ef4444',
};

export default function IncapacidadesChart({ data }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const isDark = resolvedTheme === 'dark';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                    <p className="text-xs font-semibold mb-1 opacity-60 max-w-[350px] whitespace-normal break-words">{label}</p>
                    {payload.map((e: any, i: number) => (
                        <p key={i} className="text-sm"><span className="opacity-70">{e.name}:</span> <strong>{e.value}</strong></p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const totalEstatus = data.porEstatus.reduce((s, e) => s + e.value, 0);

    return (
        <div className={`backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-lg border ${isDark ? 'bg-slate-800/90 border-slate-600/50' : 'bg-white/90 border-slate-200/50'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <ShieldAlert className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Incapacidades</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Análisis de incapacidades médicas</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total</p>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.resumen.totalIncapacidades}</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Prom. Sugeridos</p>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{data.resumen.promedioSugeridos} <span className="text-xs font-medium opacity-60">días</span></p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Prom. Autorizados</p>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.resumen.promedioAutorizados} <span className="text-xs font-medium opacity-60">días</span></p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total Días</p>
                    <p className={`text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.resumen.totalAutorizados}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Diagnósticos */}
                <div className="lg:col-span-2 h-[280px]">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top Diagnósticos</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topDiagnosticos} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} stroke={isDark ? '#64748b' : '#94a3b8'} />
                            <YAxis dataKey="name" type="category" width={160} fontSize={9} axisLine={false} tickLine={false} stroke={isDark ? '#64748b' : '#94a3b8'} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" name="Incapacidades" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} opacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Donut de Estatus */}
                <div className="h-[280px] flex flex-col">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Por Estatus</p>
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalEstatus}</p>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.porEstatus} innerRadius="55%" outerRadius="80%" paddingAngle={3} dataKey="value" strokeWidth={0}>
                                    {data.porEstatus.map((e, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[e.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 12, color: isDark ? '#fff' : '#000' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                        {data.porEstatus.map((e, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-[10px]">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[e.name] || '#64748b' }} />
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{e.name} ({e.value})</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
