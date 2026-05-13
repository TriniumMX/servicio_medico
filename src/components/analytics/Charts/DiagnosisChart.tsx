'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface DiagnosisChartProps {
    data: Array<{
        name: string;
        value: number;
        codigo: string;
        full_name: string;
    }>;
}

export default function DiagnosisChart({ data }: DiagnosisChartProps) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';

    return (
        <div className={`backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border ${isDark
            ? 'bg-slate-800/90 border-slate-600/50'
            : 'bg-white/90 border-slate-200/50'
            } h-[320px] md:h-[450px]`}>
            <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 md:mb-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Top 10 Diagnósticos (CIE-11)</h3>
            <div className="h-[calc(100%-2.5rem)] sm:h-[calc(100%-3rem)] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis type="number" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tick={{ fontSize: 10 }} />
                        <YAxis
                            type="category"
                            dataKey="codigo"
                            stroke={isDark ? '#94a3b8' : '#64748b'}
                            fontSize={10}
                            tick={{ fontSize: 10 }}
                            width={45}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1e293b' : '#fff',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: isDark ? '#fff' : '#0f172a'
                            }}
                            formatter={(value: any) => [`${(value || 0)} casos`, 'Frecuencia']}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.full_name || label;
                                }
                                return label;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell - ${index} `} fill={index < 3 ? '#0db1ec' : '#64748b'} fillOpacity={index < 3 ? 1 : 0.6} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
