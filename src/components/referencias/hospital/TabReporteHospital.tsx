'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { FileDown, RefreshCw, Search, TrendingUp, Stethoscope, Users, DollarSign } from 'lucide-react';

interface FilaReporte {
  no_nomina:           string;
  area:                string;
  trabajador:          string;
  paciente:            string;
  es_beneficiario:     boolean;
  diagnostico:         string;
  medico_tratante:     string;
  especialidad:        string;
  fecha_ingreso:       string;
  servicios_otorgados: string;
  subtotal:            number;
  estatus:             string;
}

interface ResumenEspecialidad { especialidad: string; total: number; }
interface ResumenMes          { mes: string;         total: number; }

export default function TabReporteHospital({ isDark }: { isDark: boolean }) {
  const { theme } = useTheme();
  const mounted = theme !== undefined;

  const [loading, setLoading]       = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [filas, setFilas]           = useState<FilaReporte[]>([]);
  const [resEsp, setResEsp]         = useState<ResumenEspecialidad[]>([]);
  const [resMes, setResMes]         = useState<ResumenMes[]>([]);
  const [nombreHospital, setNombre] = useState('');
  const [search, setSearch]         = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');

  // ── KPIs derivados ────────────────────────────────────────────────────────
  const totalConsultas   = filas.length;
  const totalEspecialidades = resEsp.length;
  const totalPacientes   = new Set(filas.map(f => f.no_nomina)).size;
  const totalSubtotal    = filas.reduce((s, f) => s + f.subtotal, 0);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate)   params.set('endDate',   endDate);
      const res  = await fetch(`/api/referencias/hospital/reporte?${params}`);
      const data = await res.json();
      if (data.success) {
        setFilas(data.filas ?? []);
        setResEsp(data.resumenEspecialidad ?? []);
        setResMes(data.resumenMes ?? []);
        setNombre(data.nombreHospital ?? '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Exportar Excel ────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate)   params.set('endDate',   endDate);
      const res  = await fetch(`/api/referencias/hospital/reporte/exportar-excel?${params}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `reporte_hospital_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // ── Filtro de búsqueda ────────────────────────────────────────────────────
  const filasFiltradas = filas.filter(f =>
    !search ||
    f.no_nomina.toLowerCase().includes(search.toLowerCase()) ||
    f.paciente.toLowerCase().includes(search.toLowerCase()) ||
    f.trabajador.toLowerCase().includes(search.toLowerCase()) ||
    f.especialidad.toLowerCase().includes(search.toLowerCase()) ||
    f.medico_tratante.toLowerCase().includes(search.toLowerCase())
  );

  // ── Colores ───────────────────────────────────────────────────────────────
  const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf', '#e879f9'];
  const card   = isDark ? 'bg-[#0a1929] border border-[#0f83b2]/20' : 'bg-white border border-gray-100 shadow-sm';
  const txt    = isDark ? 'text-white' : 'text-gray-900';
  const muted  = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp    = `px-3 py-2 rounded-xl border text-sm transition-colors ${
    isDark
      ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
      : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'
  } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`;

  const estBadge = (e: string) => {
    if (e === 'atendida')  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    if (e === 'asignada')  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
    if (e === 'notificada') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Encabezado + filtros ──────────────────────────────────────────── */}
      <div className={`rounded-2xl p-5 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <h2 className={`text-lg font-bold mb-0.5 ${txt}`}>
              Reporte de Consultas de Especialidad
            </h2>
            {nombreHospital && (
              <p className={`text-sm ${muted}`}>{nombreHospital}</p>
            )}
          </div>

          {/* Filtros de fecha */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${muted}`}>Desde</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className={`${inp} [color-scheme:light] dark:[color-scheme:dark]`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${muted}`}>Hasta</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className={`${inp} [color-scheme:light] dark:[color-scheme:dark]`} />
            </div>
            <button onClick={cargar} disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${
                isDark
                  ? 'bg-[#0d2137] border-[#0f83b2]/30 text-[#0db1ec] hover:bg-[#0f83b2]/10'
                  : 'bg-white border-gray-200 text-blue-600 hover:bg-blue-50'
              } disabled:opacity-50`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Filtrar
            </button>
            <button onClick={exportarExcel} disabled={exporting || filas.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              <FileDown className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Consultas',     value: totalConsultas,    icon: Stethoscope, color: 'blue',    fmt: (v: number) => v.toString() },
          { label: 'Especialidades',      value: totalEspecialidades, icon: TrendingUp, color: 'purple',  fmt: (v: number) => v.toString() },
          { label: 'Pacientes Atendidos', value: totalPacientes,    icon: Users,       color: 'emerald', fmt: (v: number) => v.toString() },
          { label: 'Subtotal',            value: totalSubtotal,     icon: DollarSign,  color: 'amber',   fmt: (v: number) => `$${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` },
        ].map(({ label, value, icon: Icon, color, fmt }) => (
          <div key={label} className={`rounded-2xl p-5 ${card}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${muted}`}>{label}</p>
                <p className={`text-2xl font-bold ${txt}`}>{loading ? '—' : fmt(value)}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${
                color === 'blue'    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300'
                : color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300'
                : color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráficas ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfica 1 — Consultas por especialidad */}
        <div className={`rounded-2xl p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${muted}`}>
            Consultas por Especialidad
          </h3>
          {resEsp.length === 0 && !loading ? (
            <div className={`flex items-center justify-center h-48 ${muted} text-sm`}>Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resEsp} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e3a5f' : '#e5e7eb'} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                <YAxis type="category" dataKey="especialidad" width={130}
                  tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#0d2137' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: isDark ? '#fff' : '#111' }}
                />
                <Bar dataKey="total" name="Consultas" radius={[0, 6, 6, 0]}
                  fill={isDark ? '#60a5fa' : '#3b82f6'} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfica 2 — Tendencia mensual */}
        <div className={`rounded-2xl p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${muted}`}>
            Tendencia Mensual
          </h3>
          {resMes.length === 0 && !loading ? (
            <div className={`flex items-center justify-center h-48 ${muted} text-sm`}>Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={resMes} margin={{ left: 0, right: 12 }}>
                <defs>
                  <linearGradient id="gradMes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={isDark ? '#0db1ec' : '#3b82f6'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? '#0db1ec' : '#3b82f6'} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e3a5f' : '#e5e7eb'} />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: isDark ? '#0d2137' : '#fff', border: 'none', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: isDark ? '#fff' : '#111' }}
                />
                <Area type="monotone" dataKey="total" name="Consultas"
                  stroke={isDark ? '#0db1ec' : '#3b82f6'} strokeWidth={2}
                  fill="url(#gradMes)" dot={{ r: 4, fill: isDark ? '#0db1ec' : '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      <div className={`rounded-2xl overflow-hidden ${card}`}>
        {/* Barra de búsqueda */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-[#0f83b2]/20' : 'border-gray-100'}`}>
          <Search className={`w-4 h-4 shrink-0 ${muted}`} />
          <input
            type="text"
            placeholder="Buscar por nómina, paciente, especialidad, médico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm ${txt} placeholder:${muted}`}
          />
          <span className={`text-xs font-medium ${muted}`}>
            {filasFiltradas.length} / {filas.length}
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDark ? 'bg-[#0d2137]' : 'bg-slate-50'}>
              <tr>
                {[
                  'NÚM. NÓMINA', 'ÁREA', 'TRABAJADOR', 'PACIENTE',
                  'DIAGNÓSTICO', 'MÉDICO TRATANTE', 'ESPECIALIDAD',
                  'FECHA INGRESO', 'SERVICIOS OTORGADOS', 'SUBTOTAL', 'ESTATUS',
                ].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap ${muted}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/10' : 'divide-gray-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? 'text-[#0db1ec]' : 'text-blue-400'}`} />
                      <span className={`text-sm ${muted}`}>Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <p className={`text-sm ${muted}`}>Sin registros para los filtros aplicados</p>
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((f, i) => (
                  <tr key={i} className={`transition-colors ${
                    isDark ? 'hover:bg-[#0f83b2]/5' : 'hover:bg-slate-50/80'
                  }`}>
                    <td className={`px-4 py-3 font-mono font-medium text-xs ${isDark ? 'text-[#0db1ec]' : 'text-blue-600'}`}>
                      {f.no_nomina}
                    </td>
                    <td className={`px-4 py-3 text-xs ${muted} max-w-[140px] truncate`} title={f.area}>{f.area}</td>
                    <td className={`px-4 py-3 font-medium text-xs ${txt} max-w-[160px] truncate`} title={f.trabajador}>{f.trabajador}</td>
                    <td className="px-4 py-3 text-xs">
                      <div className={`font-medium ${txt} truncate max-w-[140px]`} title={f.paciente}>{f.paciente}</div>
                      {f.es_beneficiario && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isDark ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>Beneficiario</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-xs ${muted} max-w-[180px]`}>
                      <span className="line-clamp-2" title={f.diagnostico}>{f.diagnostico}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${txt} whitespace-nowrap`}>{f.medico_tratante}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-lg font-medium text-[10px] ${
                        isDark ? 'bg-[#0db1ec]/15 text-[#0db1ec]' : 'bg-blue-100 text-blue-700'
                      }`}>{f.especialidad}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs whitespace-nowrap ${muted}`}>{f.fecha_ingreso}</td>
                    <td className={`px-4 py-3 text-xs ${muted} max-w-[160px]`}>
                      <span className="line-clamp-2" title={f.servicios_otorgados}>{f.servicios_otorgados || '—'}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-semibold text-right ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      ${f.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold capitalize ${estBadge(f.estatus)}`}>
                        {f.estatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de totales */}
        {filasFiltradas.length > 0 && !loading && (
          <div className={`flex items-center justify-between px-5 py-3 border-t text-xs font-semibold ${
            isDark ? 'border-[#0f83b2]/20 bg-[#0d2137]/50 text-gray-300' : 'border-gray-100 bg-slate-50 text-gray-700'
          }`}>
            <span>{filasFiltradas.length} registros</span>
            <span className={isDark ? 'text-emerald-300' : 'text-emerald-700'}>
              Total: ${filasFiltradas.reduce((s, f) => s + f.subtotal, 0)
                .toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
