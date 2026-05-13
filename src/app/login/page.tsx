'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Eye, EyeOff, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import Loader from '@/components/Loader';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const router = useRouter();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === 'dark' : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, password }),
      });

      if (res.ok) {
        const data = await res.json();

        // --- CORRECCIÓN AQUÍ ---
        // Pasamos los permisos que vienen de la API al contexto
        login(data.user, data.permissions);

        router.push('/dashboard');
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Error en el inicio de sesión.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('No se pudo conectar al servidor. Inténtelo más tarde.');
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Loading screen mientras se monta el tema - Optimized
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full border-3 border-cyan-400/20 border-t-cyan-500 animate-spin" />
          <span className="text-gray-500 font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 relative overflow-hidden ${isDark
        ? 'bg-gradient-to-br from-[#020617] via-[#0a1929] to-[#0f172a]'
        : 'bg-white'
        }`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute inset-0 ${isDark
              ? 'bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)]'
              : 'bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)]'
              } bg-[size:4rem_4rem]`}
          />
        </div>
        <Loader text="Iniciando sesión..." size="lg" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 relative overflow-hidden ${isDark
      ? 'bg-gradient-to-br from-[#020617] via-[#0a1929] to-[#0f172a]'
      : 'bg-white'
      }`}>
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute inset-0 ${isDark
            ? 'bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)]'
            } bg-[size:4rem_4rem]`}
        />

        {/* Static Orbs - Optimized */}
        <div
          className={`absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[120px] transition-opacity duration-1000 ${isDark
            ? 'bg-[#009EF0] opacity-20'
            : 'bg-[#009EF0] opacity-[0.06]'
            }`}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] transition-opacity duration-1000 ${isDark
            ? 'bg-[#009EF0] opacity-20'
            : 'bg-[#009EF0] opacity-[0.06]'
            }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] transition-opacity duration-1000 ${isDark
            ? 'bg-[#009EF0] opacity-15'
            : 'bg-[#009EF0] opacity-[0.05]'
            }`}
        />
      </div>

      {/* Toggle Theme Button - Premium Design */}
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`absolute top-6 right-6 p-4 rounded-2xl transition-all duration-500 z-10 backdrop-blur-xl border group ${isDark
          ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 shadow-2xl shadow-[#009EF0]/10'
          : 'bg-white hover:bg-white border-[#009EF0]/15 hover:border-[#009EF0]/25 shadow-lg shadow-[#009EF0]/8'
          }`}
      >
        {isDark ? (
          <Sparkles className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all duration-300" />
        ) : (
          <span className="text-2xl transition-all duration-300">🌙</span>
        )}
      </motion.button>

      {/* Login Card - Optimized */}
      <div className="relative w-full max-w-md z-10 opacity-0 animate-fade-in-up">
        {/* Card Glow Effect */}
        <div className={`absolute -inset-0.5 rounded-[2rem] blur-2xl transition-all duration-500 ${isDark
          ? 'bg-[#009EF0]/20'
          : 'bg-[#009EF0]/8'
          }`} />

        <div className={`relative rounded-[1.75rem] backdrop-blur-2xl border transition-all duration-500 overflow-hidden ${isDark
          ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-white/10 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.3)]'
          : 'bg-white border-[#009EF0]/20 shadow-[0_8px_32px_-8px_rgba(0,158,240,0.15)]'
          }`}>
          {/* Top Shine Effect */}
          <div className={`absolute top-0 left-0 right-0 h-px ${isDark
            ? 'bg-gradient-to-r from-transparent via-[#009EF0]/50 to-transparent'
            : 'bg-gradient-to-r from-transparent via-[#009EF0]/40 to-transparent'
            }`} />
          {/* Header con Logo - Premium */}
          <div className="p-10 pb-6 text-center relative">
            <div className="inline-block mb-8 relative opacity-0 animate-fade-in-scale delay-100">
              <div className="relative w-36 h-36 mx-auto group">
                {/* Rotating Border Effect - Optimized */}
                {/* Gentle Vitality Effect - Elegant & Medical */}
                <motion.div
                  animate={{
                    borderColor: isDark
                      ? ["rgba(0,158,240,0.1)", "rgba(0,158,240,0.6)", "rgba(0,158,240,0.1)"]
                      : ["rgba(0,158,240,0.1)", "rgba(0,158,240,0.4)", "rgba(0,158,240,0.1)"],
                    boxShadow: isDark
                      ? ["0 0 0px rgba(0,158,240,0)", "0 0 25px rgba(0,158,240,0.3)", "0 0 0px rgba(0,158,240,0)"]
                      : ["0 0 0px rgba(0,158,240,0)", "0 0 20px rgba(0,158,240,0.2)", "0 0 0px rgba(0,158,240,0)"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute inset-0 rounded-[2rem] border-2 bg-transparent`}
                />

                {/* Static Clean Border Overlay for Definition */}
                <div className={`absolute inset-0 rounded-[2rem] border ${isDark ? 'border-white/5' : 'border-black/5'
                  }`} />

                {/* Logo Container */}
                <div className={`absolute inset-[2px] rounded-[1.875rem] overflow-hidden flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-white'
                  } shadow-2xl`}>
                  {!logoError ? (
                    <img
                      src="/logo_pandora.png"
                      alt="PANDORA"
                      className="w-24 h-24 object-contain relative z-10 transition-transform duration-300 hover:scale-105"
                      onError={() => setLogoError(true)}
                      loading="eager"
                    />
                  ) : (
                    <span className="text-6xl font-black text-[#009EF0] relative z-10 transition-transform duration-300 hover:scale-110">
                      P
                    </span>
                  )}
                </div>

                {/* Ambient Glow - Static */}
                <div
                  className={`absolute inset-0 rounded-[2rem] blur-2xl transition-opacity duration-1000 ${isDark
                    ? 'bg-[#009EF0]/30 opacity-40'
                    : 'bg-[#009EF0]/15 opacity-40'
                    }`}
                />
              </div>
            </div>

            <div className="opacity-0 animate-fade-in delay-200">
              <h1 className={`text-4xl font-extrabold mb-3 tracking-tight transition-all duration-500 ${isDark
                ? 'text-white drop-shadow-[0_2px_10px_rgba(0,158,240,0.3)]'
                : 'text-gray-900'
                }`}>
                PAND<span className={`inline-block transition-all duration-500 text-[#009EF0]`}>O</span>RA
              </h1>
              <p className={`text-sm font-medium tracking-wide transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>
                Sistema de Gestión Médica
              </p>
            </div>
          </div>

          {/* Form - Premium Inputs */}
          <form onSubmit={handleSubmit} className="px-10 pb-8 space-y-6">
            {/* Usuario Input */}
            <div className="group opacity-0 animate-fade-in delay-300">
              <label
                htmlFor="usuario"
                className={`block text-sm font-bold mb-3 transition-all duration-300 ${isDark ? 'text-slate-300' : 'text-gray-600'
                  }`}
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <User className={`h-5 w-5 transition-all duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-[#009EF0]' : 'text-gray-400 group-focus-within:text-[#009EF0]'
                    }`} />
                </div>
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  className={`w-full pl-12 pr-5 py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:scale-[1.01] ${isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:bg-white/10 focus:border-[#009EF0]/50 focus:ring-[#009EF0]/30 shadow-lg shadow-black/10'
                    : 'bg-white border border-[#009EF0]/15 text-gray-700 placeholder-gray-400 focus:bg-white focus:border-[#009EF0]/40 focus:ring-[#009EF0]/20 shadow-sm shadow-[#009EF0]/5'
                    }`}
                  placeholder="Ingrese su usuario"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="group opacity-0 animate-fade-in delay-400">
              <label
                htmlFor="password"
                className={`block text-sm font-bold mb-3 transition-all duration-300 ${isDark ? 'text-slate-300' : 'text-gray-600'
                  }`}
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <Lock className={`h-5 w-5 transition-all duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-[#009EF0]' : 'text-gray-400 group-focus-within:text-[#009EF0]'
                    }`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full pl-12 pr-14 py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:scale-[1.01] ${isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:bg-white/10 focus:border-[#009EF0]/50 focus:ring-[#009EF0]/30 shadow-lg shadow-black/10'
                    : 'bg-white border border-[#009EF0]/15 text-gray-700 placeholder-gray-400 focus:bg-white focus:border-[#009EF0]/40 focus:ring-[#009EF0]/20 shadow-sm shadow-[#009EF0]/5'
                    }`}
                  placeholder="••••••••"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-300 z-10 ${isDark
                    ? 'hover:bg-white/10 active:bg-white/5'
                    : 'hover:bg-[#009EF0]/10 active:bg-[#009EF0]/20'
                    }`}
                >
                  {showPassword ? (
                    <EyeOff className={`h-5 w-5 transition-colors ${isDark ? 'text-slate-400 hover:text-[#009EF0]' : 'text-gray-500 hover:text-[#009EF0]'
                      }`} />
                  ) : (
                    <Eye className={`h-5 w-5 transition-colors ${isDark ? 'text-slate-400 hover:text-[#009EF0]' : 'text-gray-500 hover:text-[#009EF0]'
                      }`} />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Error Message - Optimized */}
            {error && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 ${isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                  : 'bg-red-50 border-red-200/80 text-red-600 shadow-sm'
                  }`}
              >
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold mb-0.5">Error de autenticación</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button - Optimized */}
            <div className="pt-2 opacity-0 animate-fade-in delay-500">
              <button
                type="submit"
                className={`relative w-full py-4 rounded-xl font-bold text-white overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] ${isDark
                  ? 'bg-[#009EF0] hover:bg-[#008fd9] focus:ring-[#009EF0]/50 focus:ring-offset-slate-900 shadow-[0_10px_40px_-10px_rgba(0,158,240,0.4)]'
                  : 'bg-[#009EF0] hover:bg-[#008fd9] focus:ring-[#009EF0]/50 focus:ring-offset-white shadow-[0_10px_40px_-10px_rgba(0,158,240,0.3)]'
                  }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide">
                  Iniciar Sesión
                  <span>→</span>
                </span>
              </button>
            </div>
          </form>

          {/* Footer - Optimized */}
          <div className={`relative px-10 py-6 text-center transition-all duration-500 opacity-0 animate-fade-in delay-600 ${isDark
            ? 'border-t border-white/5 bg-gradient-to-t from-slate-950/50 to-transparent'
            : 'border-t border-[#009EF0]/10 bg-gradient-to-t from-[#009EF0]/5 to-transparent'
            }`}>
            <p className={`text-xs font-medium tracking-wider transition-colors duration-500 ${isDark ? 'text-slate-500' : 'text-gray-500'
              }`}>
              © 2025 <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>PANDORA</span>.Sistema de Servicio Medico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}