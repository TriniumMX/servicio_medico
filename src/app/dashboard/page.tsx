// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Activity, TrendingUp,
  Clock, FileText, Stethoscope, AlertCircle,
  Sparkles, ArrowRight, Heart, LayoutDashboard,
  ShieldCheck, Wifi, Zap
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
// Image import removed - usando img tag nativo
import Link from 'next/link';
import { getPusherClient } from '@/lib/pusher';

// ... existing imports ...

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = mounted && theme === 'dark';
  const canViewMetrics = hasPermission('VER_METRICAS_DASHBOARD');

  // Estado para estadísticas
  const [stats, setStats] = useState({
    consultasHoy: 0,
    citasAgendadas: 0,
    pacientesEnEspera: 0,
    recetasSurtidas: 0
  });
  const [loading, setLoading] = useState(true);

  // Determinar el saludo según la hora
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // Cargar datos reales
  useEffect(() => {
    if (!canViewMetrics) return;

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // 🔔 Suscribirse a actualizaciones en tiempo real
    const pusherClient = getPusherClient();
    const channel = pusherClient.subscribe('dashboard');

    channel.bind('stats-refresh', (data: any) => {
      console.log('🔔 Dashboard: Actualizando estadísticas...', data);
      fetchStats();
    });

    return () => {
      pusherClient.unsubscribe('dashboard');
    };
  }, [canViewMetrics]);

  // Estado para Avisos
  interface Aviso {
    id_aviso: number;
    titulo: string;
    mensaje: string;
    etiqueta_nombre: string;
    etiqueta_color: string;
    fecha_creacion: string;
    activo: boolean;
  }
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  // Cargar Avisos y Suscribirse a Pusher
  useEffect(() => {
    const fetchAvisos = async () => {
      try {
        console.log('🔄 Dashboard: Cargando avisos...');
        const res = await fetch('/api/admin/avisos');
        const data = await res.json();
        if (res.ok) {
          console.log('✅ Dashboard: Avisos cargados:', data.length);
          setAvisos(data);
        }
      } catch (e) {
        console.error('❌ Error fetching avisos:', e);
      }
    };

    // Solo cargar avisos si NO ve métricas (para no hacer fetch innecesario)
    if (!canViewMetrics) {
      fetchAvisos();
    }

    // SIEMPRE suscribirse a Pusher (para actualizar en tiempo real)
    console.log('🔌 Dashboard: Suscribiéndose al canal avisos-channel...');
    const pusherClient = getPusherClient();
    const channel = pusherClient.subscribe('avisos-channel');

    channel.bind('nuevo-aviso', (data: any) => {
      console.log('📢 Dashboard: Evento nuevo-aviso recibido:', data);
      // Refrescar la lista de avisos (solo si no ve métricas)
      if (!canViewMetrics) {
        fetchAvisos();
      }
    });

    channel.bind('eliminar-aviso', ({ id_aviso }: { id_aviso: number }) => {
      console.log('🗑️ Dashboard: Eliminando aviso:', id_aviso);
      setAvisos(prev => prev.filter(a => a.id_aviso !== id_aviso));
    });

    return () => {
      console.log('🔌 Dashboard: Desuscribiéndose de avisos-channel');
      channel.unbind('nuevo-aviso');
      channel.unbind('eliminar-aviso');
      pusherClient.unsubscribe('avisos-channel');
    };
  }, [canViewMetrics]);

  // ... (rest of the component)

  const quickAccess = [
    {
      title: 'Consultas',
      description: 'Gestiona las consultas médicas activas',
      icon: Stethoscope,
      href: '/consultas',
      color: 'from-[#0f83b2] to-[#2dafdc]'
    },
    {
      title: 'Agenda',
      description: 'Visualiza y programa citas médicas',
      icon: Calendar,
      href: '/agenda',
      color: 'from-[#2dafdc] to-[#2fcbaf]'
    },
    {
      title: 'Pacientes',
      description: 'Administra el registro de pacientes',
      icon: Users,
      href: '/pacientes',
      color: 'from-[#2fcbaf] to-[#0f83b2]'
    },
    {
      title: 'Reportes',
      description: 'Genera reportes y estadísticas',
      icon: FileText,
      href: '/reportes',
      color: 'from-[#0f83b2] to-[#2fcbaf]'
    }
  ];

  const todayStats = [
    {
      title: 'Consultas Hoy',
      value: loading ? '...' : stats.consultasHoy,
      icon: Users,
      trend: undefined
    },
    {
      title: 'Citas Agendadas',
      value: loading ? '...' : stats.citasAgendadas,
      icon: Calendar
    },
    {
      title: 'Pacientes en Espera',
      value: loading ? '...' : stats.pacientesEnEspera,
      icon: Activity,
      trend: stats.pacientesEnEspera > 0 ? 'En sala' : undefined
    },
    {
      title: 'Recetas Surtidas',
      value: loading ? '...' : stats.recetasSurtidas,
      icon: FileText
    }
  ];

  return (
    <div className={`space-y-6 sm:space-y-8 max-w-[1600px] mx-auto ${!canViewMetrics ? 'min-h-[85vh] flex flex-col justify-center relative' : ''}`}>

      {/* Hero Section con Logo - SE MANTIENE IGUAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative rounded-3xl p-6 sm:p-8 md:p-12 overflow-hidden shadow-2xl ${isDark
          ? 'bg-gradient-to-br from-[#0f83b2] via-[#2dafdc] to-[#2fcbaf]'
          : 'bg-gradient-to-br from-[#0f83b2] via-[#2dafdc] to-[#2fcbaf]'
          }`}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Saludo y Bienvenida */}
          <div className="flex-1 text-white text-center md:text-left">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center md:justify-start gap-3 mb-2"
            >
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-white/90" />
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
                {getGreeting()}, {user?.nombre?.split(' ')[0]}!
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-base md:text-xl text-white/90 font-light max-w-2xl"
            >
              Bienvenido al sistema de gestión médica <span className="font-semibold">PANDORA</span>
            </motion.p>
          </div>

          {/* Sección Derecha: Reloj y Logo */}
          <div className="flex flex-row items-center justify-center md:justify-end gap-4 md:gap-8 w-full md:w-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center md:items-end text-white/90 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-2xl md:text-4xl font-bold tabular-nums tracking-tight">
                  {currentTime.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs md:text-sm font-medium uppercase tracking-wider opacity-80">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>
                  {currentTime.toLocaleDateString('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/20 backdrop-blur-md rounded-3xl p-3 sm:p-4 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300 hidden md:flex"
            >
              <img
                src="/logo_pandora.png"
                alt="PANDORA Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ... (Main Content) ... */}

      {/* VISTA SIMPLIFICADA (INFORMACIÓN INSTITUCIONAL) */}
      {!canViewMetrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Columna Izquierda: Avisos y Novedades (2/3 del ancho) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <AlertCircle size={20} />
              </div>
              Avisos Institucionales
            </h2>

            <div className="grid gap-4">
              {avisos.length > 0 ? (
                avisos.map((aviso, i) => (
                  <motion.div
                    key={aviso.id_aviso}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + (i * 0.1) }}
                    className={`p-5 rounded-2xl border transition-all hover:shadow-lg ${isDark
                      ? 'bg-[#0a1929] border-[#0f83b2]/20 hover:border-[#2dafdc]/50'
                      : 'bg-white border-gray-100 hover:border-blue-200'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${aviso.etiqueta_color}`}>
                        {aviso.etiqueta_nombre}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {aviso.fecha_creacion ? new Date(aviso.fecha_creacion).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Sin fecha'}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {aviso.titulo}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {aviso.mensaje}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className={`text-center p-8 rounded-2xl border border-dashed ${isDark ? 'border-gray-700 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="text-gray-500">No hay avisos recientes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Directorio y Guardia (1/3 del ancho) */}
          <div className="space-y-6">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <div className="p-2 bg-teal-500/10 rounded-lg text-teal-500">
                <ShieldCheck size={20} />
              </div>
              Personal de Guardia
            </h2>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0a1929]/50 border-[#0f83b2]/20' : 'bg-white border-gray-100'
                }`}
            >
              <ul className="space-y-4">
                {[
                  { nombre: 'Dr. Roberto Mendoza', rol: 'Coordinador Médico', ext: '105' },
                  { nombre: 'Dra. Ana Silva', rol: 'Urgencias', ext: '122' },
                  { nombre: 'Ing. Carlos Ruiz', rol: 'Soporte Técnico', ext: '550' }
                ].map((p, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {p.nombre.charAt(4)}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.nombre}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{p.rol}</span>
                        <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                        <span className="text-[#2dafdc]">Ext. {p.ext}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                <button className="w-full py-2 text-sm font-medium text-[#2dafdc] hover:bg-[#2dafdc]/10 rounded-lg transition-colors">
                  Ver Directorio Completo
                </button>
              </div>
            </motion.div>

            {/* Tarjeta de Clima / Fecha (Compacta) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className={`p-6 rounded-2xl border overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-[#0f83b2]/20 to-[#2dafdc]/5 border-[#0f83b2]/20' : 'bg-blue-50 border-blue-100'
                }`}
            >
              <div className="relative z-10">
                <p className={`text-sm font-medium ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>San Juan del Río</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>24°C</span>
                  <span className="text-sm mb-1 opacity-80">Soleado</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={64} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Contenido protegido por permisos - Métricas y Accesos (Solo si tiene permiso) */}
      {canViewMetrics && (
        <>
          {/* ... (Existing Metric Stats Code) ... */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.h2
              className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-800'}`}
            >
              <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-[#2dafdc]" />
              Resumen de Hoy
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {todayStats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <StatCard {...stat} isDark={isDark} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Accesos Rápidos - SI TIENE METRICAS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.h2
              className={`text-2xl font-bold mb-6 flex items-center gap-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-800'}`}
            >
              <Heart className="h-7 w-7 text-[#2fcbaf]" />
              Accesos Rápidos
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickAccess.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <QuickAccessCard {...item} isDark={isDark} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mensaje motivacional - SI TIENE METRICAS */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className={`p-6 rounded-2xl text-center transition-all duration-300 ${isDark
              ? 'bg-gradient-to-r from-[#0f83b2]/10 to-[#2fcbaf]/10 border border-[#0f83b2]/20'
              : 'bg-gradient-to-r from-[#0f83b2]/5 to-[#2fcbaf]/5 border border-gray-200'
              }`}
          >
            <p className={`text-lg font-medium transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              "La medicina es el arte de acompañar al paciente hasta que la naturaleza cura la enfermedad"
            </p>
            <p className={`text-sm mt-2 transition-colors duration-300 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              - Hipócrates
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}

// Componente de tarjeta de acceso rápido
function QuickAccessCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  isDark
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        className={`group p-6 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 relative overflow-hidden ${isDark
          ? 'bg-gradient-to-br from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20 hover:border-[#2dafdc]/50'
          : 'bg-white border border-gray-100 hover:border-[#2dafdc]/50'
          }`}
      >
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#2dafdc]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative z-10">
          <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-800'
            }`}>
            {title}
          </h3>
          <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {description}
          </p>
          <div className="flex items-center gap-2 mt-4 text-[#2dafdc] group-hover:gap-4 transition-all duration-300">
            <span className="text-sm font-medium">Acceder</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Componente de estadística
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  isDark
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  isDark: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-6 rounded-2xl shadow-lg transition-all duration-300 ${isDark
        ? 'bg-gradient-to-br from-[#0a1929] to-[#0d2137] border border-[#0f83b2]/20'
        : 'bg-white border border-gray-100'
        }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {title}
          </p>
          <h3 className={`text-3xl font-bold mt-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-800'
            }`}>
            {value}
          </h3>
          {trend && (
            <p className="text-sm mt-2 text-[#2fcbaf] font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {trend}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#0f83b2] to-[#2dafdc]">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}