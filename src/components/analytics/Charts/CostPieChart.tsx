'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface CostPieChartProps {
    data: Array<{
        name: string;
        value: number;
    }>;
}

const COLORS = ['#3b82f6', '#8b5cf6'];
const LABELS = ['Médicos Generales', 'Especialistas'];

export default function CostPieChart({ data }: CostPieChartProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';
    const total = data.reduce((sum, item) => sum + item.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const entry = payload[0];
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
            return (
                <div className={`px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md ${isDark ? 'bg-slate-800/95 border-slate-600/50 text-white' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                    <p className="text-xs font-semibold mb-1 opacity-60">{entry.name}</p>
                    <p className="text-sm font-bold">${Number(entry.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs opacity-50 mt-0.5">{pct}% del total</p>
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

            <h3 className={`text-base sm:text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                Distribución de Costos
            </h3>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0 relative">
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-center">
                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total</p>
                        <p className={`text-xl sm:text-2xl font-black tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            ${total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius="55%"
                            outerRadius="80%"
                            paddingAngle={4}
                            dataKey="value"
                            strokeWidth={0}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend - custom */}
            <div className={`flex flex-col gap-2 pt-3 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                {data.map((item, index) => {
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                    return (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                </span>
                                <span className={`text-[10px] tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {pct}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
