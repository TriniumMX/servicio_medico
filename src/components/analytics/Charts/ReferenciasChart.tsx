'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { GitBranch, Clock } from 'lucide-react';

interface Props {
    data: {
        embudo: Array<{ name: string; estatus: string; value: number }>;
        tiempos: Array<{ name: string; dias: number }>;
        tiempoTotal: number;
        especialidades: Array<{ name: string; total: number; atendidas: number; canceladas: number }>;
    };
}

const FUNNEL_COLORS: Record<string, string> = {
    pendiente_autorizar: '#f59e0b',
    pendiente_asignar: '#f59e0b', // Legacy
    autorizada: '#8b5cf6',
    asignada: '#3b82f6',
    notificada: '#06b6d4',
    atendida: '#10b981',
    cancelada: '#ef4444',
};

export default function ReferenciasChart({ data }: Props) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    const isDark = resolvedTheme === 'dark';

    const totalRefs = data.embudo.reduce((s, e) => s + e.value, 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                    <p className="text-xs font-semibold mb-1 opacity-60">{label}</p>
                    {payload.map((e: any, i: number) => (
                        <p key={i} className="text-sm"><span className="opacity-70">{e.name}:</span> <strong>{e.dataKey === 'dias' ? `${e.value} días` : e.value}</strong></p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-lg border ${isDark ? 'bg-slate-800/90 border-slate-600/50' : 'bg-white/90 border-slate-200/50'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10">
                        <GitBranch className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Referencias a Especialistas</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{totalRefs} referencias en el período</p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>
                    <Clock size={14} />
                    <span className="text-xs font-bold">{data.tiempoTotal} días prom. total</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Embudo de fases */}
                <div className="h-[280px]">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Embudo de Fases</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.embudo} margin={{ top: 0, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis dataKey="name" fontSize={8} angle={-35} textAnchor="end" height={55} axisLine={false} tickLine={false} stroke={isDark ? '#64748b' : '#94a3b8'} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} stroke={isDark ? '#64748b' : '#94a3b8'} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Referencias" radius={[6, 6, 0, 0]} barSize={28}>
                                {data.embudo.map((e, i) => (
                                    <Cell key={i} fill={FUNNEL_COLORS[e.estatus] || '#64748b'} opacity={0.85} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Especialidades */}
                <div className="h-[280px]">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Especialidades Demandadas</p>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.especialidades} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                            <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} stroke={isDark ? '#64748b' : '#94a3b8'} />
                            <YAxis dataKey="name" type="category" width={110} fontSize={9} axisLine={false} tickLine={false} stroke={isDark ? '#64748b' : '#94a3b8'} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" name="Total" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={14} opacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
