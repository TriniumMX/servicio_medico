'use client';

import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface TemporalChartProps {
    data: Array<{
        name: string;
        consultas: number;
        costo?: number;
    }>;
}

export default function TemporalChart({ data }: TemporalChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';
    const hasCostData = data.some(d => (d.costo ?? 0) > 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                    <p className="text-xs font-semibold mb-2 opacity-60">{label}</p>
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="opacity-70">{entry.name}:</span>
                            <span className="font-bold">
                                {entry.dataKey === 'costo'
                                    ? `$${Number(entry.value).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
                                    : entry.value
                                }
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`backdrop-blur-md rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border ${isDark
            ? 'bg-slate-800/90 border-slate-600/50'
            : 'bg-white/90 border-slate-200/50'
            }`}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        Tendencia de Consultas Diarias
                    </h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Volumen de consultas {hasCostData ? 'y costos asociados' : ''} por día
                    </p>
                </div>
                {hasCostData && (
                    <div className="hidden sm:flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#0db1ec]" />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Consultas</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-[#f59e0b] rounded" style={{ width: 12 }} />
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Costo</span>
                        </span>
                    </div>
                )}
            </div>
            <div className="h-[260px] md:h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 5, right: hasCostData ? 50 : 10, left: -10, bottom: 10 }}
                    >
                        <defs>
                            <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0db1ec" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#0db1ec" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                        <XAxis
                            dataKey="name"
                            stroke={isDark ? '#64748b' : '#94a3b8'}
                            fontSize={10}
                            tickMargin={8}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke={isDark ? '#64748b' : '#94a3b8'}
                            fontSize={10}
                            width={35}
                            axisLine={false}
                            tickLine={false}
                        />
                        {hasCostData && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#f59e0b"
                                fontSize={9}
                                width={55}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="consultas"
                            name="Consultas"
                            stroke="#0db1ec"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorConsultas)"
                            dot={false}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: '#0db1ec', fill: isDark ? '#1e293b' : '#fff' }}
                        />
                        {hasCostData && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="costo"
                                name="Costo"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                strokeDasharray="6 3"
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: '#f59e0b', fill: isDark ? '#1e293b' : '#fff' }}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
