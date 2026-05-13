'use client';

import { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { useMotionValue, useSpring, useInView } from 'framer-motion';
import { useTheme } from 'next-themes';

interface KPICardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    colorClassName?: string;
}

const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 60,
        duration: 2000
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [motionValue, value, isInView]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            if (ref.current) {
                // Determine if we need decimals based on the target value
                const hasDecimals = value % 1 !== 0;

                // Format the number
                const formattedNumber = latest.toLocaleString('es-MX', {
                    minimumFractionDigits: hasDecimals ? 2 : 0,
                    maximumFractionDigits: hasDecimals ? 2 : 0,
                });

                ref.current.textContent = `${prefix}${formattedNumber}${suffix}`;
            }
        });
    }, [springValue, prefix, suffix, value]);

    // Set initial content to avoid layout shift or empty flash
    return <span ref={ref} className="tabular-nums">{prefix}0{suffix}</span>;
};

// Helper to parse string values like "$25,000" or "35%"
const parseValue = (val: string | number) => {
    if (typeof val === 'number') {
        return { number: val, prefix: '', suffix: '' };
    }

    // Remove commas for parsing
    const cleanStr = val.replace(/,/g, '');
    const numberMatch = cleanStr.match(/-?[\d\.]+/);

    if (!numberMatch) return { number: 0, prefix: '', suffix: '' };

    const number = parseFloat(numberMatch[0]);
    const numberIndex = cleanStr.indexOf(numberMatch[0]);

    // Re-extract prefix/suffix from original string ensuring we don't grab commas as part of logic but visual is consistent
    // Actually, simpler: identify non-digit characters at start and end of ORIGINAL string
    // But original has commas... "$25,099.87"

    // Better strategy:
    // Prefix: Everything before the first digit
    // Suffix: Everything after the last digit? No, decimals are digits.

    const prefixMatch = val.match(/^[^0-9\.\-]+/);
    const suffixMatch = val.match(/[^0-9\.]+$/); // This might catch " %"

    return {
        number,
        prefix: prefixMatch ? prefixMatch[0] : '',
        suffix: suffixMatch ? suffixMatch[0] : ''
    };
};

export default function KPICard({ title, value, subValue, icon: Icon, trend, colorClassName = 'bg-blue-500' }: KPICardProps) {
    const { prefix, number, suffix } = parseValue(value);
    // Explicitly grab theme for reliable styling
    const { resolvedTheme } = useTheme(); // useTheme is not imported! Wait, I need to check imports.
    // Actually, I can allow the parent to pass isDark? No, avoid prop drilling if possible.
    // But adding useTheme imports to KPICard requires checking if it's there. 
    // Step 858 showed imports: useEffect, useRef, LucideIcon, framer-motion.
    // I need to add useTheme import.

    // Actually, let's defer KPICard logic update until I verify imports.
    // Step 858: I should have added import { useTheme } from 'next-themes' if I want to use it.
    // Let's do a replace that includes the import.
    return (
        <div className={`backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${(resolvedTheme === 'dark')
            ? 'bg-slate-800/90 border-slate-600/50'
            : 'bg-white/90 border-slate-200/50'
            }`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-medium mb-1 leading-tight ${resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
                    <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 ${resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-800'} truncate`}>
                        <AnimatedCounter value={number} prefix={prefix} suffix={suffix} />
                    </h3>
                    {subValue && (
                        <p className={`text-xs mt-1 line-clamp-1 ${resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{subValue}</p>
                    )}
                </div>
                <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${colorClassName} shadow-lg flex-shrink-0`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend.isPositive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-xs text-slate-400">vs mes anterior</span>
                </div>
            )}
        </div>
    );
}
