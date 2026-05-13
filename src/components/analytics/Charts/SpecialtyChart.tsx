'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface SpecialtyChartProps {
    data: Array<{
        name: string;
        value: number;
        ingreso: number;
    }>;
    title?: string;
    color?: string;
    showBoth?: boolean;
}

export default function SpecialtyChart({ data, title = "Productividad por Especialidad", color = "#0db1ec", showBoth = false }: SpecialtyChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';
    const colorIngresos = "#10b981";

    // Totals for summary
    const totalConsultas = data.reduce((sum, d) => sum + d.value, 0);
    const totalIngreso = data.reduce((sum, d) => sum + Number(d.ingreso || 0), 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                    <p className="text-xs font-semibold mb-2 opacity-60 max-w-[200px] truncate">{label}</p>
                    {payload.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="opacity-70">{entry.name}:</span>
                            <span className="font-bold">
                                {entry.name === 'Gastos'
                                    ? `$${Number(entry.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
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
            } h-[360px] md:h-[450px] flex flex-col`}>

            {/* Header with summary */}
            <div className="mb-4 md:mb-5">
                <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} truncate`}>{title}</h3>
                <div className="flex items-center gap-4 mt-1.5">
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className="font-semibold" style={{ color }}>{totalConsultas}</span> consultas
                    </span>
                    {showBoth && totalIngreso > 0 && (
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <span className="font-semibold text-emerald-500">${totalIngreso.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span> gastos
                        </span>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: showBoth ? 50 : 10, left: -10, bottom: 5 }}
                        layout="horizontal"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                        <XAxis
                            dataKey="name"
                            stroke={isDark ? '#64748b' : '#94a3b8'}
                            fontSize={9}
                            tick={{ fontSize: 9 }}
                            tickMargin={5}
                            angle={data.length > 4 ? -45 : 0}
                            textAnchor={data.length > 4 ? 'end' : 'middle'}
                            height={data.length > 4 ? 60 : 30}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke={isDark ? '#64748b' : '#94a3b8'}
                            fontSize={10}
                            tick={{ fontSize: 10 }}
                            width={35}
                            axisLine={false}
                            tickLine={false}
                        />
                        {showBoth && (
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke={colorIngresos}
                                fontSize={9}
                                tick={{ fontSize: 9 }}
                                width={55}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                            />
                        )}
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#334155' : '#f1f5f9', opacity: 0.4 }} />
                        {showBoth && (
                            <Legend
                                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                iconType="circle"
                                iconSize={8}
                            />
                        )}
                        <Bar
                            yAxisId="left"
                            dataKey="value"
                            name="Consultas"
                            fill={color}
                            radius={[6, 6, 0, 0]}
                            barSize={showBoth ? 18 : 32}
                            opacity={0.85}
                        />
                        {showBoth && (
                            <Bar
                                yAxisId="right"
                                dataKey="ingreso"
                                name="Gastos"
                                fill={colorIngresos}
                                radius={[6, 6, 0, 0]}
                                barSize={18}
                                opacity={0.85}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
