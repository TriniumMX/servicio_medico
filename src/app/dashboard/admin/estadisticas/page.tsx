'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
    Activity,
    Users,
    Pill,
    DollarSign,
    Filter,
    Beaker,
    Calendar,
    FlaskConical,
    CheckCircle2,
    TrendingUp,
    Stethoscope,
    ClipboardList,
    FileSpreadsheet,
    Mail,
    X,
    Loader2,
    Send
} from 'lucide-react';
import DiagnosisChart from '@/components/analytics/Charts/DiagnosisChart';
import TemporalChart from '@/components/analytics/Charts/TemporalChart';
import SpecialtyChart from '@/components/analytics/Charts/SpecialtyChart';
import CostPieChart from '@/components/analytics/Charts/CostPieChart';
import IncapacidadesChart from '@/components/analytics/Charts/IncapacidadesChart';
import ReferenciasChart from '@/components/analytics/Charts/ReferenciasChart';
import InventarioChart from '@/components/analytics/Charts/InventarioChart';
import RecetasChart from '@/components/analytics/Charts/RecetasChart';

export default function AnalyticsPage() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    const isDark = mounted && resolvedTheme === 'dark';

    // State for Filters - Default to last 3 months
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [kpis, setKpis] = useState<any>(null);
    const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
    const [departamentos, setDepartamentos] = useState<any[]>([]);
    const [temporalData, setTemporalData] = useState<any[]>([]);
    const [productivity, setProductivity] = useState<{ generales: any[], especialistas: any[] } | null>(null);
    const [costData, setCostData] = useState<{ name: string; value: number }[]>([]);
    const [incapacidadesData, setIncapacidadesData] = useState<any>(null);
    const [referenciasData, setReferenciasData] = useState<any>(null);
    const [inventarioData, setInventarioData] = useState<any>(null);
    const [recetasData, setRecetasData] = useState<any>(null);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchData(); // Initial load
    }, []);

    // Re-fetch when date changes is handled by "Filtrar" button or explicit effect?
    // User logic in previous version was "handleFilter" calls fetchData.
    // Given the request for defaults, we want the initial fetch to respect these defaults.
    // The useEffect above calls fetchData() which will use the state values.

    const fetchData = async () => {
        setLoading(true);
        try {
            // Construct Query Params
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const queryString = params.toString();

            const [resKpis, resDiag, resTemp, resProd, resIncap, resRef, resInv, resRecetas] = await Promise.all([
                fetch(`/api/analytics/kpis?${queryString}`),
                fetch(`/api/analytics/diagnosticos?${queryString}`),
                fetch(`/api/analytics/temporal?${queryString}`),
                fetch(`/api/analytics/productivity?${queryString}`),
                fetch(`/api/analytics/incapacidades?${queryString}`),
                fetch(`/api/analytics/referencias?${queryString}`),
                fetch(`/api/analytics/inventario`),
                fetch(`/api/analytics/recetas?${queryString}`)
            ]);

            const dataKpis = await resKpis.json();
            const dataDiag = await resDiag.json();
            const dataTemp = await resTemp.json();
            const dataProd = await resProd.json();
            const dataIncap = await resIncap.json();
            const dataRef = await resRef.json();
            const dataInv = await resInv.json();
            const dataRecetas = await resRecetas.json();

            if (dataKpis.success) setKpis(dataKpis.data);
            if (dataDiag.success) {
                setDiagnosticos(dataDiag.data.diagnosticos);
                setDepartamentos(dataDiag.data.departamentos);
            }
            if (dataTemp.success) setTemporalData(dataTemp.data.diario);
            if (dataProd.success) {
                setProductivity(dataProd.data);

                // Calculate Totals for Pie Chart
                const totalGeneral = dataProd.data.generales.reduce((acc: number, curr: any) => acc + Number(curr.ingreso || 0), 0);
                const totalSpecialist = dataProd.data.especialistas.reduce((acc: number, curr: any) => acc + Number(curr.ingreso || 0), 0);

                setCostData([
                    { name: 'Médicos Generales', value: totalGeneral },
                    { name: 'Especialistas', value: totalSpecialist }
                ]);
            }
            if (dataIncap.success) setIncapacidadesData(dataIncap.data);
            if (dataRef.success) setReferenciasData(dataRef.data);
            if (dataInv.success) setInventarioData(dataInv.data);
            if (dataRecetas.success) setRecetasData(dataRecetas.data);

        } catch (error) {
            console.error('Error cargando analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchData();
    };

    const handleExportExcel = async () => {
        setExportingExcel(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await fetch(`/api/analytics/exportar-excel?${params.toString()}`);
            if (!res.ok) throw new Error('Error al exportar');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics_${startDate}_${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar el archivo Excel');
        } finally {
            setExportingExcel(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailTo.trim()) return;
        setSendingEmail(true);
        try {
            const res = await fetch('/api/analytics/enviar-correo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destinatarios: emailTo.split(',').map(e => e.trim()).filter(Boolean),
                    startDate,
                    endDate
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Correo enviado exitosamente a ${data.enviados} destinatario(s)`);
                setShowEmailModal(false);
                setEmailTo('');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error enviando correo:', error);
            alert('Error al enviar el correo');
        } finally {
            setSendingEmail(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className={`min-h-full transition-colors duration-500 ${isDark
            ? 'bg-slate-900' // Usar fondo sólido para integrarse mejor o mantener gradiente si se desea, pero el borde será visible.
            : 'bg-slate-50'
            }`}>
            {/* Glassmorphism Container */}
            <div className={`max-w-[1600px] mx-auto backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 ${isDark
                ? 'bg-slate-900/70 border border-slate-700/50'
                : 'bg-white/70 border border-white/20'
                }`}>

                {/* Header & Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                            Analisis de datos
                        </h1>
                        <p className={`mt-1 text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Métricas estratégicas y financieras en tiempo real
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`w-full lg:w-auto grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end gap-3 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border ${isDark
                            ? 'bg-slate-800/80 border-slate-600/50'
                            : 'bg-white/80 border-slate-200/50'
                            }`}
                    >
                        <div className="flex flex-col gap-1 w-full min-w-0 overflow-hidden">
                            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Desde</label>
                            <div className="relative w-full">
                                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`pl-8 sm:pl-10 pr-2 sm:pr-3 border rounded-lg py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full min-w-0 transition-colors ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 w-full min-w-0 overflow-hidden">
                            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hasta</label>
                            <div className="relative w-full">
                                <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`pl-8 sm:pl-10 pr-2 sm:pr-3 border rounded-lg py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full min-w-0 transition-colors ${isDark
                                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleFilter}
                                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-initial shadow-md"
                            >
                                <Filter className="w-4 h-4" />
                                Filtrar
                            </button>
                            <button
                                onClick={handleExportExcel}
                                disabled={exportingExcel || !kpis}
                                className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-md"
                                title="Exportar a Excel"
                            >
                                {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={() => setShowEmailModal(true)}
                                disabled={!kpis}
                                className="h-10 px-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 shadow-md"
                                title="Enviar por correo"
                            >
                                <Mail className="w-4 h-4" />
                                <span className="hidden sm:inline">Correo</span>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {loading && !kpis ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : kpis ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4 sm:space-y-6 md:space-y-8"
                    >
                        {/* Dashboard KPIs - Diseño Ejecutivo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">

                            {/* SECCIÓN: LABORATORIO */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-violet-950/50 to-slate-900' : 'bg-gradient-to-br from-violet-50 to-white'} border ${isDark ? 'border-violet-500/20' : 'border-violet-200'} p-5 md:p-6`}
                                style={{ borderRadius: '2px' }}
                            >
                                {/* Accent Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500" />

                                {/* Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-violet-500/10 rounded-lg">
                                        <FlaskConical className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <h3 className={`font-semibold tracking-wide uppercase text-sm ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                        Laboratorio
                                    </h3>
                                </div>

                                {/* Stats Grid */}
                                <div className="space-y-4">
                                    {/* Estudios Generados */}
                                    <div className={`flex justify-between items-end pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                        <div>
                                            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Generados</p>
                                            <p className={`text-2xl md:text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {kpis.estudios_laboratorio?.generados?.total || 0}
                                            </p>
                                        </div>
                                        <p className={`text-sm font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                            ${(kpis.estudios_laboratorio?.generados?.costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {/* Estudios Autorizados */}
                                    <div className={`flex justify-between items-end pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                        <div>
                                            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Autorizados</p>
                                            <p className={`text-2xl md:text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {kpis.estudios_laboratorio?.autorizados?.total || 0}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                ${(kpis.estudios_laboratorio?.autorizados?.costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Gasto Total Lab */}
                                    <div className="pt-2">
                                        <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gasto Total</p>
                                        <p className="text-3xl md:text-4xl font-black tabular-nums bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                                            ${(kpis.estudios_laboratorio?.autorizados?.costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* SECCIÓN: CONSULTAS */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-cyan-950/50 to-slate-900' : 'bg-gradient-to-br from-cyan-50 to-white'} border ${isDark ? 'border-cyan-500/20' : 'border-cyan-200'} p-5 md:p-6`}
                                style={{ borderRadius: '2px' }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />

                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <Stethoscope className="w-5 h-5 text-cyan-500" />
                                    </div>
                                    <h3 className={`font-semibold tracking-wide uppercase text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                        Consultas
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Total Consultas */}
                                    <div className={`pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                        <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Total</p>
                                        <p className={`text-2xl md:text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                            {kpis.consultas.total}
                                        </p>
                                    </div>

                                    {/* Incapacidades */}
                                    <div className={`pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                        <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Incapacidades</p>
                                        <div className="flex justify-between items-end">
                                            <p className={`text-2xl md:text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {kpis.incapacidades.total}
                                            </p>
                                            <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                                                {kpis.incapacidades.tasa}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Gasto Consultas */}
                                    <div className="pt-2">
                                        <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gasto Consultas</p>
                                        <p className="text-3xl md:text-4xl font-black tabular-nums bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                                            ${(kpis.consultas.costo_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* SECCIÓN: FARMACIA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-emerald-950/50 to-slate-900' : 'bg-gradient-to-br from-emerald-50 to-white'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'} p-5 md:p-6`}
                                style={{ borderRadius: '2px' }}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />

                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Pill className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h3 className={`font-semibold tracking-wide uppercase text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                        Farmacia
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Recetas totales */}
                                    <div className={`pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recetas Emitidas</p>
                                            <p className={`text-lg font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {kpis.recetas?.total || 0}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Surtidas</span>
                                                </div>
                                                <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    {kpis.recetas?.surtidas || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Parciales</span>
                                                </div>
                                                <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                    {kpis.recetas?.parciales || 0}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No Surtidas</span>
                                                </div>
                                                <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                                    {kpis.recetas?.no_surtidas || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gasto Farmacia */}
                                    <div className="pt-2">
                                        <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gasto Farmacia</p>
                                        <p className="text-3xl md:text-4xl font-black tabular-nums bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
                                            ${kpis.gasto_farmacia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* SECCIÓN: RESUMEN TOTAL */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-rose-950/50 to-slate-900' : 'bg-gradient-to-br from-rose-50 to-white'} border ${isDark ? 'border-rose-500/20' : 'border-rose-200'} p-5 md:p-6`}
                                style={{ borderRadius: '2px' }}
                            >
                                {/* Accent Line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />

                                {/* Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-rose-500/10 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <h3 className={`font-semibold tracking-wide uppercase text-sm ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                                        Resumen Total
                                    </h3>
                                </div>

                                {/* Stats Grid */}
                                <div className="space-y-4">
                                    {/* Desglose */}
                                    <div className={`space-y-2 pb-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Consultas</span>
                                            <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                                ${(kpis.consultas.costo_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Laboratorio</span>
                                            <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                                                ${(kpis.estudios_laboratorio?.autorizados?.costo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Farmacia</span>
                                            <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                ${kpis.gasto_farmacia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barra Visual */}
                                    {(() => {
                                        const totalGasto = (kpis.consultas.costo_total || 0) + (kpis.estudios_laboratorio?.autorizados?.costo || 0) + kpis.gasto_farmacia || 1;
                                        return (
                                            <div className="space-y-2">
                                                <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                                    <div className="bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500" style={{ width: `${((kpis.consultas.costo_total || 0) / totalGasto) * 100}%` }} />
                                                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500" style={{ width: `${((kpis.estudios_laboratorio?.autorizados?.costo || 0) / totalGasto) * 100}%` }} />
                                                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500" style={{ width: `${(kpis.gasto_farmacia / totalGasto) * 100}%` }} />
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className={`flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        <span className="w-2 h-2 rounded-full bg-cyan-500" /> Cons
                                                    </span>
                                                    <span className={`flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        <span className="w-2 h-2 rounded-full bg-violet-500" /> Lab
                                                    </span>
                                                    <span className={`flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Farm
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Gasto Total */}
                                    <div className="pt-2">
                                        <p className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gasto Total Período</p>
                                        <p className="text-3xl md:text-4xl font-black tabular-nums bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                                            ${((kpis.consultas.costo_total || 0) + kpis.gasto_farmacia + (kpis.estudios_laboratorio?.autorizados?.costo || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                        </div>

                        {/* Charts Row: Temporal Overview */}
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                            <TemporalChart data={temporalData} />
                        </div>

                        {/* Productivity Row */}
                        {productivity && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                                {/* General Doctors */}
                                <div className="w-full">
                                    <SpecialtyChart
                                        data={productivity.generales}
                                        title="Médicos Generales"
                                        color="#3b82f6" // Blue
                                    />
                                </div>
                                {/* Specialists */}
                                <div className="w-full">
                                    <SpecialtyChart
                                        data={productivity.especialistas}
                                        title="Especialistas"
                                        color="#8b5cf6" // Violet
                                    />
                                </div>
                                {/* Cost Pie Chart */}
                                <div className="w-full md:col-span-2 xl:col-span-1">
                                    <CostPieChart data={costData} />
                                </div>
                            </div>
                        )}

                        {/* Diagnosis & Specialties */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                            <DiagnosisChart data={diagnosticos} />
                            <SpecialtyChart
                                data={departamentos}
                                title="Consultas y Gastos por Departamento"
                                color="#f59e0b" // Amber
                                showBoth={true}
                            />
                        </div>

                        {/* Incapacidades */}
                        {incapacidadesData && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                                <IncapacidadesChart data={incapacidadesData} />
                            </div>
                        )}

                        {/* Recetas */}
                        {recetasData && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                                <RecetasChart data={recetasData} />
                            </div>
                        )}

                        {/* Referencias */}
                        {referenciasData && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                                <ReferenciasChart data={referenciasData} />
                            </div>
                        )}

                        {/* Inventario */}
                        {inventarioData && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                                <InventarioChart data={inventarioData} />
                            </div>
                        )}

                    </motion.div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-slate-500 dark:text-slate-400">No se pudieron cargar los datos.</p>
                    </div>
                )}
            </div>

            {/* Modal Enviar Correo */}
            {showEmailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Enviar Reporte por Correo</h3>
                            <button onClick={() => setShowEmailModal(false)} className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Se enviara un resumen de analytics con el archivo Excel adjunto para el periodo {startDate} a {endDate}.
                        </p>
                        <div className="mb-4">
                            <label className={`text-xs font-medium block mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Correo(s) destinatario(s)
                            </label>
                            <input
                                type="text"
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                placeholder="correo@ejemplo.com, otro@ejemplo.com"
                                className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}
                            />
                            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Separar multiples correos con coma</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowEmailModal(false)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail || !emailTo.trim()}
                                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {sendingEmail ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function calculateTrend(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
}
