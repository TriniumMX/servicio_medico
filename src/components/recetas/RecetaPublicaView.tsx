'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { User, Calendar, FileText, Stethoscope, Pill, CheckCircle, Clock, Hash, Shield, Eye, Activity, FlaskConical, Share2, ClipboardList, AlertCircle, FileClock, Bell, RefreshCw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecetaPublicaViewProps {
  data: {
    receta: {
      id_receta: number;
      folio_receta: string;
      fecha_emision: Date;
      vigencia_dias: number;
      observaciones_generales: string | null;
    };
    consulta: {
      folio: string;
      nombre: string;
      edad: number | null;
      fecha_consulta: Date;
      cie11_codigo: string | null;
      cie11_titulo: string | null;
      subjetivo: string | null;
      analisis: string | null;
      plan: string | null;
      nombre_medico: string | null;
    };
    medicamentos: Array<{
      nombre_comercial: string;
      sustancia_activa: string;
      dosis: string;
      duracion_tratamiento_dias: number;
      cantidad_total: number;
      indicaciones: string | null;
      realizar_resurtimiento: boolean;
      meses_resurtimiento: number | null;
      surtimientos: Array<{
        cantidad_surtida: number;
        fecha_surtimiento: Date;
        mes_resurtimiento: number;
        observaciones: string | null;
      }>;
      proximoResurtimiento?: {
        mes: number;
        fecha_aproximada: Date;
      } | null;
      totalMeses?: number;
      mesesCompletados?: number;
      totalSurtido?: number;
    }>;
    incapacidad?: {
      fecha_inicio: Date;
      fecha_fin: Date;
      dias_sugeridos: number;
      dias_autorizados: number | null;
      motivo: string;
      motivo_rechazo: string | null;
      creado_en?: Date;
      estatus: string;
    } | null;
    estudiosLaboratorio?: Array<{
      nombre_estudio: string;
      motivo: string;
      creado_en: Date;
      estatus: string;
      motivo_rechazo: string | null;
    }>;
    referencia?: {
      id_referencia: number;
      folio: string;
      nombre_especialidad: string;
      motivo_referencia: string;
      estatus: string;
      creado_en: Date;
      fecha_cita: Date | null;
      nombre_medico_asignado: string | null;
      reprogramada: boolean;
      fecha_reprogramacion: Date | null;
      email_notificacion: string | null;
    } | null;
    seguimiento?: {
      id_referencia: number;
      folio: string;
      nombre_especialidad: string;
      motivo_referencia: string;
      estatus: string;
      creado_en: Date;
      fecha_sugerida_seguimiento: Date | null;
      fecha_autorizacion: Date | null;
      fecha_asignacion: Date | null;
      fecha_notificacion: Date | null;
      fecha_cita: Date | null;
      nombre_medico_sugerido: string | null;
      nombre_medico_asignado: string | null;
    } | null;
    tokenInfo: {
      visitas: number;
      fecha_expiracion: Date;
    };
  };
}

export default function RecetaPublicaView({ data }: RecetaPublicaViewProps) {
  const { receta, consulta, medicamentos, tokenInfo, incapacidad, estudiosLaboratorio, referencia, seguimiento } = data;
  const params = useParams();
  const token = params?.token as string;

  // Estado para expandir/colapsar SOAP
  const [expandSoap, setExpandSoap] = useState(false);

  // Estado para el formulario de email opt-in
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailGuardado, setEmailGuardado] = useState(referencia?.email_notificacion ?? null);

  const handleGuardarEmail = async () => {
    if (!emailInput.trim() || !token) return;
    setEmailStatus('loading');
    try {
      const res = await fetch(`/api/r/${token}/email-referencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setEmailStatus('success');
        setEmailGuardado(emailInput.trim());
      } else {
        setEmailStatus('error');
      }
    } catch {
      setEmailStatus('error');
    }
  };

  // Formatear fechas
  const formatearFecha = (fecha: Date | string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatearFechaCorta = (fecha: Date | string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatearFechaConHora = (fecha: Date | string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  return (
    <div className="min-h-screen bg-[#020817] py-6 sm:py-8 lg:py-10 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Background Decorativo - Gradient Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 relative z-10">

        {/* Header - Premium Glassmorphism */}
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative bg-[#0a1929]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            {/* Elemento Decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative w-14 h-14 flex items-center justify-center p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-white/10 shadow-lg shadow-blue-500/20">
                    <Image
                      src="/logo_pandora.png"
                      alt="Logo Pandora"
                      width={40}
                      height={40}
                      className="object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Receta Médica</h1>
                    <p className="text-sm text-blue-200/70 font-medium">Sistema Médico Pandora SJR</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end">
                <div className="bg-blue-950/40 border border-blue-500/20 rounded-xl px-5 py-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-300/80 uppercase tracking-wider mb-1 font-semibold">Folio de Receta</p>
                  <p className="text-xl sm:text-2xl font-bold text-white font-mono tracking-widest">
                    {receta.folio_receta}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN SOAP + DIAGNÓSTICO */}
        <div className="bg-[#0a1929]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-[#0a1929]/80 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Resumen Clínico</h3>
            </div>
            {(consulta.subjetivo || consulta.analisis) && (
              <button
                onClick={() => setExpandSoap(!expandSoap)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20"
              >
                {expandSoap ? 'Ver menos' : 'Ver detalle completo'}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Diagnóstico Principal */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Stethoscope size={14} className="text-purple-400" /> Diagnóstico CIE-11
              </p>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-purple-500/10">
                {consulta.cie11_codigo ? (
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-sm font-bold font-mono border border-purple-500/20 self-start">
                      {consulta.cie11_codigo}
                    </span>
                    <p className="text-base text-white font-medium">{consulta.cie11_titulo || 'Sin descripción'}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No especificado</p>
                )}
              </div>
            </div>

            {/* Detalles SOAP (Expandibles) */}
            <AnimatePresence>
              {expandSoap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  {consulta.subjetivo && (
                    <div className="bg-slate-900/30 rounded-xl p-4 border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Nota Subjetiva</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{consulta.subjetivo}</p>
                    </div>
                  )}
                  {consulta.analisis && (
                    <div className="bg-slate-900/30 rounded-xl p-4 border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Análisis Médico</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{consulta.analisis}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* GRID DE ACCIONES CLÍNICAS (Referencia, Incapacidad, Laboratorio) */}
        {/* GRID DE ACCIONES CLÍNICAS (Referencia, Incapacidad, Laboratorio) */}


        {/* REFERENCIA A ESPECIALIDAD — desde que el coordinador la autoriza */}
        {referencia && ['autorizada', 'asignada', 'notificada', 'atendida'].includes(referencia.estatus) && (
          <div className="bg-[#0a1929]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-[#0a1929]/80 transition-colors duration-300 relative overflow-hidden">
            {/* Elemento decorativo de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 relative z-10">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Share2 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Referencia a Especialidad</h3>
                <p className="text-xs text-slate-400 mt-0.5">Referencia solicitada a: <span className="text-indigo-300 font-semibold">{referencia.nombre_especialidad}</span></p>
              </div>
              {/* Badge de Estatus Actual */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                referencia.estatus === 'pendiente_autorizar'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : referencia.estatus === 'autorizada'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : ['asignada', 'notificada', 'atendida'].includes(referencia.estatus)
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {referencia.estatus === 'pendiente_autorizar' ? 'PENDIENTE'
                  : referencia.estatus === 'autorizada' ? 'EN PROCESO'
                  : referencia.estatus === 'asignada' ? 'CITA ASIGNADA'
                  : referencia.estatus === 'notificada' ? 'NOTIFICADA'
                  : referencia.estatus === 'atendida' ? 'ATENDIDA'
                  : referencia.estatus.toUpperCase()}
              </div>
            </div>

            <div className="relative z-10">
              {/* TimeLine / Stepper Visual */}
              <div className="relative pb-8">
                {/* Línea conectora */}
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-800"></div>

                {/* Paso 1: Emisión del médico */}
                <div className="flex items-start gap-4 mb-8 relative">
                  <div className="w-16 flex-shrink-0 flex justify-end pr-4 text-xs text-slate-500 pt-1">
                    Paso 1
                  </div>
                  <div className="w-4 h-4 rounded-full bg-indigo-500 border-4 border-[#0a1929] relative z-10 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]"></div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-bold text-indigo-200">Emisión Médica</p>
                    <p className="text-xs text-slate-400">El médico general emitió la solicitud de referencia.</p>
                    <p className="text-xs text-slate-500 mt-1">{formatearFechaConHora(referencia.creado_en)}</p>
                  </div>
                </div>

                {/* Paso 2: Autorización del Coordinador */}
                <div className={`flex items-start gap-4 mb-8 relative ${referencia.estatus === 'pendiente_autorizar' ? 'opacity-40' : ''}`}>
                  <div className="w-16 flex-shrink-0 flex justify-end pr-4 text-xs text-slate-500 pt-1">
                    Paso 2
                  </div>
                  <div className={`w-4 h-4 rounded-full border-4 border-[#0a1929] relative z-10 ${referencia.estatus !== 'pendiente_autorizar' ? 'bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'bg-slate-700'}`}></div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-bold ${referencia.estatus !== 'pendiente_autorizar' ? 'text-indigo-200' : 'text-slate-500'}`}>Autorización del Coordinador</p>
                    <p className="text-xs text-slate-400">
                      {referencia.estatus !== 'pendiente_autorizar'
                        ? 'El coordinador médico autorizó su solicitud de referencia.'
                        : 'En espera de autorización del coordinador médico.'}
                    </p>
                  </div>
                </div>

                {/* Paso 3: Asignación por el Hospital */}
                <div className={`flex items-start gap-4 relative ${!['asignada', 'notificada', 'atendida'].includes(referencia.estatus) ? 'opacity-40' : ''}`}>
                  <div className="w-16 flex-shrink-0 flex justify-end pr-4 text-xs text-slate-500 pt-1">
                    Paso 3
                  </div>
                  <div className={`w-4 h-4 rounded-full border-4 border-[#0a1929] relative z-10 ${['asignada', 'notificada', 'atendida'].includes(referencia.estatus) ? 'bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]' : 'bg-slate-700'}`}></div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-bold ${['asignada', 'notificada', 'atendida'].includes(referencia.estatus) ? 'text-green-300' : 'text-slate-500'}`}>Cita con el Especialista</p>
                    <p className="text-xs text-slate-400">
                      {['asignada', 'notificada', 'atendida'].includes(referencia.estatus)
                        ? 'El hospital asignó su cita. Puede acudir a recoger su referencia.'
                        : 'Pendiente de asignación de medico especialista.'}
                    </p>
                    {/* Datos de la cita inline en el paso 3 */}
                    {['asignada', 'notificada', 'atendida'].includes(referencia.estatus) &&
                      (referencia.nombre_medico_asignado || referencia.fecha_cita) && (
                      <div className="mt-3 bg-green-500/5 border border-green-500/10 rounded-xl p-3 space-y-2">
                        {referencia.nombre_medico_asignado && (
                          <div className="flex items-center gap-2">
                            <Stethoscope size={13} className="text-green-400/70 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Especialista</p>
                              <p className="text-sm font-semibold text-slate-200">{referencia.nombre_medico_asignado}</p>
                            </div>
                          </div>
                        )}
                        {referencia.fecha_cita && (
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-green-400/70 shrink-0" />
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Fecha y Hora</p>
                              <p className="text-sm font-semibold text-slate-200">{formatearFechaConHora(referencia.fecha_cita)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner: Cita Reprogramada */}
              {referencia.reprogramada && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 mt-3">
                  <RefreshCw size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-300">Cita Reprogramada</p>
                    <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                      El hospital reprogramó la fecha para tu cita con el médico de{' '}
                      <span className="font-semibold text-amber-300">{referencia.nombre_especialidad}</span>
                      {referencia.nombre_medico_asignado && (
                        <>, <span className="font-semibold text-amber-300">"{referencia.nombre_medico_asignado}"</span></>
                      )}
                      {referencia.fecha_cita && (
                        <>. La nueva fecha y hora es:{' '}
                          <span className="font-semibold text-amber-300">{formatearFechaConHora(referencia.fecha_cita)}</span>
                        </>
                      )}
                      . Lamentamos los inconvenientes.
                    </p>
                  </div>
                </div>
              )}

              {['asignada', 'notificada', 'atendida'].includes(referencia.estatus) && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3 mt-3">
                  <AlertCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-300">¡Referencia Lista!</p>
                    <p className="text-xs text-green-200/70 mt-1">
                      Su pase de referencia ya está disponible. Acérquese a la administración para recibir su turno con el especialista.
                    </p>
                  </div>
                </div>
              )}

              {/* Email opt-in — solo si hay referencia activa y no está atendida */}
              {referencia.estatus !== 'atendida' && referencia.estatus !== 'cancelada' && (
                <div className="mt-4 bg-slate-900/50 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={15} className="text-indigo-400 shrink-0" />
                    <p className="text-sm font-semibold text-slate-200">Notificaciones por correo</p>
                  </div>

                  {emailGuardado ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Mail size={13} className="shrink-0" />
                      <span>Recibirás avisos en <span className="font-semibold">{emailGuardado}</span></span>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400 mb-3">
                        ¿Deseas recibir un correo cuando tu cita sea asignada o reprogramada?
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => { setEmailInput(e.target.value); setEmailStatus('idle'); }}
                          placeholder="tu@correo.com"
                          className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                          onKeyDown={(e) => e.key === 'Enter' && handleGuardarEmail()}
                        />
                        <button
                          onClick={handleGuardarEmail}
                          disabled={emailStatus === 'loading' || !emailInput.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {emailStatus === 'loading' ? '...' : 'Activar'}
                        </button>
                      </div>
                      {emailStatus === 'error' && (
                        <p className="text-xs text-red-400 mt-2">Error al guardar. Intenta de nuevo.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ SEGUIMIENTO ══════ */}
        {seguimiento && (
          <div className="relative overflow-hidden bg-[#0a1929]/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6">
            {/* Glow decorativo ámbar */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-tr-full pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 border-b border-amber-500/15 pb-4 relative z-10">
              <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400">
                <RefreshCw size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Cita de Seguimiento</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tu especialista de <span className="text-amber-300 font-semibold">{seguimiento.nombre_especialidad}</span> ha solicitado una consulta de seguimiento
                </p>
              </div>
              {/* Badge estatus */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                seguimiento.estatus === 'pendiente_autorizar'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : seguimiento.estatus === 'autorizada'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : ['asignada', 'notificada'].includes(seguimiento.estatus)
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {seguimiento.estatus === 'pendiente_autorizar' ? 'EN REVISIÓN'
                  : seguimiento.estatus === 'autorizada'    ? 'AUTORIZADO'
                  : seguimiento.estatus === 'asignada'      ? 'CITA ASIGNADA'
                  : seguimiento.estatus === 'notificada'    ? 'LISTO'
                  : seguimiento.estatus.toUpperCase()}
              </div>
            </div>

            {/* Banner fecha sugerida */}
            {seguimiento.fecha_sugerida_seguimiento && (
              <div className="relative z-10 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="p-2.5 bg-amber-500/20 rounded-lg shrink-0">
                  <Calendar size={20} className="text-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-400/70 uppercase font-bold tracking-wider">Próxima cita sugerida</p>
                  <p className="text-base font-bold text-amber-200 mt-0.5">
                    {new Date(seguimiento.fecha_sugerida_seguimiento).toLocaleDateString('es-MX', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  {(seguimiento.nombre_medico_asignado || seguimiento.nombre_medico_sugerido) && (
                    <p className="text-xs text-amber-300/70 mt-0.5 flex items-center gap-1">
                      <Stethoscope size={11} className="shrink-0" />
                      {seguimiento.nombre_medico_asignado ?? seguimiento.nombre_medico_sugerido}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Timeline del flujo */}
            <div className="relative z-10">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">Seguimiento del trámite</p>
              <div className="relative pb-2">
                {/* Línea vertical */}
                <div className="absolute left-[30px] top-4 bottom-0 w-0.5 bg-slate-800" />

                {/* Paso 1: Solicitud del especialista */}
                <div className="flex items-start gap-4 mb-7 relative">
                  <div className="w-[44px] flex-shrink-0 flex justify-end pr-2 pt-0.5">
                    <div className="w-4 h-4 rounded-full bg-amber-500 border-4 border-[#0a1929] shadow-[0_0_0_4px_rgba(245,158,11,0.2)]" />
                  </div>
                  <div className="flex-1 pt-0">
                    <p className="text-sm font-bold text-amber-200">Seguimiento solicitado</p>
                    <p className="text-xs text-slate-400">Tu especialista solicitó una nueva consulta de seguimiento.</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatearFechaConHora(seguimiento.creado_en)}</p>
                  </div>
                </div>

                {/* Paso 2: Autorización del coordinador */}
                <div className={`flex items-start gap-4 mb-7 relative ${seguimiento.estatus === 'pendiente_autorizar' ? 'opacity-40' : ''}`}>
                  <div className="w-[44px] flex-shrink-0 flex justify-end pr-2 pt-0.5">
                    <div className={`w-4 h-4 rounded-full border-4 border-[#0a1929] ${seguimiento.estatus !== 'pendiente_autorizar' ? 'bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'bg-slate-700'}`} />
                  </div>
                  <div className="flex-1 pt-0">
                    <p className={`text-sm font-bold ${seguimiento.estatus !== 'pendiente_autorizar' ? 'text-indigo-200' : 'text-slate-500'}`}>
                      Revisión del coordinador
                    </p>
                    <p className="text-xs text-slate-400">
                      {seguimiento.estatus !== 'pendiente_autorizar'
                        ? 'El coordinador médico autorizó tu cita de seguimiento.'
                        : 'En espera de revisión por el coordinador médico.'}
                    </p>
                    {seguimiento.fecha_autorizacion && (
                      <p className="text-xs text-slate-500 mt-0.5">{formatearFechaConHora(seguimiento.fecha_autorizacion)}</p>
                    )}
                  </div>
                </div>

                {/* Paso 3: Asignación de cita */}
                <div className={`flex items-start gap-4 mb-7 relative ${!['asignada', 'notificada'].includes(seguimiento.estatus) ? 'opacity-40' : ''}`}>
                  <div className="w-[44px] flex-shrink-0 flex justify-end pr-2 pt-0.5">
                    <div className={`w-4 h-4 rounded-full border-4 border-[#0a1929] ${['asignada', 'notificada'].includes(seguimiento.estatus) ? 'bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]' : 'bg-slate-700'}`} />
                  </div>
                  <div className="flex-1 pt-0">
                    <p className={`text-sm font-bold ${['asignada', 'notificada'].includes(seguimiento.estatus) ? 'text-green-300' : 'text-slate-500'}`}>
                      Cita asignada por el hospital
                    </p>
                    <p className="text-xs text-slate-400">
                      {['asignada', 'notificada'].includes(seguimiento.estatus)
                        ? 'El hospital confirmó tu cita de seguimiento.'
                        : 'Pendiente de confirmación de fecha y especialista.'}
                    </p>
                    {seguimiento.fecha_cita && (
                      <div className="mt-2 bg-green-500/5 border border-green-500/10 rounded-lg p-2.5 space-y-1.5">
                        {seguimiento.nombre_medico_asignado && (
                          <div className="flex items-center gap-2">
                            <Stethoscope size={12} className="text-green-400/70 shrink-0" />
                            <p className="text-xs font-semibold text-slate-200">{seguimiento.nombre_medico_asignado}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-green-400/70 shrink-0" />
                          <p className="text-xs font-semibold text-slate-200">{formatearFechaConHora(seguimiento.fecha_cita)}</p>
                        </div>
                      </div>
                    )}
                    {seguimiento.fecha_asignacion && (
                      <p className="text-xs text-slate-500 mt-0.5">{formatearFechaConHora(seguimiento.fecha_asignacion)}</p>
                    )}
                  </div>
                </div>

                {/* Paso 4: Notificación al paciente */}
                <div className={`flex items-start gap-4 relative ${seguimiento.estatus !== 'notificada' ? 'opacity-40' : ''}`}>
                  <div className="w-[44px] flex-shrink-0 flex justify-end pr-2 pt-0.5">
                    <div className={`w-4 h-4 rounded-full border-4 border-[#0a1929] ${seguimiento.estatus === 'notificada' ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]' : 'bg-slate-700'}`} />
                  </div>
                  <div className="flex-1 pt-0">
                    <p className={`text-sm font-bold ${seguimiento.estatus === 'notificada' ? 'text-emerald-300' : 'text-slate-500'}`}>
                      ¡Listo para tu cita!
                    </p>
                    <p className="text-xs text-slate-400">
                      {seguimiento.estatus === 'notificada'
                        ? 'Fuiste notificado. Acércate a administración para recoger tu pase de seguimiento.'
                        : 'Recibirás una notificación cuando tu cita esté confirmada.'}
                    </p>
                    {seguimiento.fecha_notificacion && (
                      <p className="text-xs text-slate-500 mt-0.5">{formatearFechaConHora(seguimiento.fecha_notificacion)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Folio */}
            <div className="relative z-10 mt-4 pt-4 border-t border-amber-500/10 flex items-center justify-between">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Folio de seguimiento</p>
              <p className="font-mono text-xs font-bold text-amber-400/70">{seguimiento.folio}</p>
            </div>
          </div>
        )}
        {/* ══════ FIN SEGUIMIENTO ══════ */}

        {/* INCAPACIDAD */}
        {incapacidad && (
          <>
            {/* PENDIENTE — solo aviso, sin datos */}
            {incapacidad.estatus === 'PENDIENTE' && (
              <div className="bg-amber-500/5 border border-amber-500/20 backdrop-blur-md rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-amber-500/20">
                  <div className="p-2 bg-amber-500/15 rounded-lg text-amber-400">
                    <FileClock size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white flex-1">Incapacidad</h3>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    <Clock size={11} />
                    Pendiente de Autorización
                  </span>
                </div>
                <div className="flex items-start gap-3 text-sm text-amber-200/80">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                  <p className="leading-relaxed">
                    Tu médico solicitó una <strong className="text-amber-300">incapacidad médica</strong> en esta consulta.
                    Está <strong className="text-amber-300">pendiente de autorización</strong> por el coordinador médico.
                    Una vez autorizada podrás ver los detalles aquí.
                  </p>
                </div>
              </div>
            )}

            {/* AUTORIZADA — mostrar todo */}
            {incapacidad.estatus === 'AUTORIZADA' && (
              <div className="bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-md border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-red-500/20">
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                    <FileClock size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white flex-1">Incapacidad</h3>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/25">
                    <CheckCircle size={11} />
                    Autorizada
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-red-950/30 rounded-xl p-4 border border-red-500/10">
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Días Autorizados</p>
                      <p className="text-4xl font-black text-white">
                        {incapacidad.dias_autorizados ?? incapacidad.dias_sugeridos}
                      </p>
                      {incapacidad.dias_autorizados != null && incapacidad.dias_autorizados !== incapacidad.dias_sugeridos && (
                        <p className="text-xs text-slate-500 mt-1">Médico sugirió: {incapacidad.dias_sugeridos} días</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-slate-400">Del: <span className="text-white font-semibold">{formatearFechaCorta(incapacidad.fecha_inicio)}</span></p>
                      <p className="text-xs text-slate-400">Al: <span className="text-white font-semibold">{formatearFechaCorta(incapacidad.fecha_fin)}</span></p>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-slate-500 uppercase mb-1">Motivo</p>
                    <p className="text-sm text-slate-300 italic line-clamp-3">"{incapacidad.motivo}"</p>
                  </div>
                </div>
              </div>
            )}

            {/* RECHAZADA — mostrar motivo */}
            {incapacidad.estatus === 'RECHAZADA' && (
              <div className="bg-red-500/5 border border-red-500/20 backdrop-blur-md rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-red-500/20">
                  <div className="p-2 bg-red-500/15 rounded-lg text-red-400">
                    <FileClock size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white flex-1">Incapacidad</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/25">
                    No Autorizada
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <p className="text-sm text-red-200/80 leading-relaxed mb-2">
                      La incapacidad solicitada por tu médico <strong className="text-red-300">no fue autorizada</strong> por el coordinador médico.
                    </p>
                    {incapacidad.motivo_rechazo && (
                      <div className="bg-red-950/30 border border-red-500/15 rounded-xl p-3">
                        <p className="text-xs text-red-400/70 uppercase font-semibold mb-1">Motivo</p>
                        <p className="text-sm text-slate-300 italic">"{incapacidad.motivo_rechazo}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ESTUDIOS DE LABORATORIO — solo autorizados */}
        {(() => {
          const autorizados = (estudiosLaboratorio ?? []).filter(e => ['AUTORIZADO', 'ENTREGADO'].includes(e.estatus));
          if (autorizados.length === 0) return null;
          return (
            <div className="bg-[#0a1929]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-[#0a1929]/80 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                  <FlaskConical size={20} />
                </div>
                <h3 className="text-lg font-bold text-white flex-1">Estudios de Laboratorio</h3>
                <span className="text-xs text-slate-500">{autorizados.length} estudio{autorizados.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-2">
                {autorizados.map((estudio, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 shadow-[0_0_6px_rgba(250,204,21,0.4)]" />
                    <div>
                      <p className="text-sm font-bold text-slate-200">{estudio.nombre_estudio}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{estudio.motivo}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-xs text-yellow-200/70 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>Estudios autorizados, favor de pasar a la administración de su hospital para recoger el pase al estudio.</span>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Datos del Paciente */}
          <div className="bg-[#0a1929]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-[#0a1929]/80 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Datos del Paciente</h3>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre Completo</p>
                <p className="text-lg font-semibold text-slate-200">{consulta.nombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Edad</p>
                  <p className="text-base font-medium text-slate-300">{consulta.edad || 'N/A'} años</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Consulta</p>
                  <p className="text-base font-medium text-slate-300">{formatearFecha(consulta.fecha_consulta)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Folio Consulta</p>
                <p className="text-sm font-mono text-slate-400">{consulta.folio}</p>
              </div>
            </div>
          </div>

          {/* Detalles de la Receta */}
          <div className="bg-[#0a1929]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:bg-[#0a1929]/80 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Detalles de la Receta</h3>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                  <Hash size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vigencia</p>
                  <p className="text-base font-medium text-slate-200">{receta.vigencia_dias} días</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Emisión</p>
                  <p className="text-base font-medium text-slate-200">{formatearFechaConHora(receta.fecha_emision)}</p>
                </div>
              </div>

              {(consulta.cie11_codigo || consulta.cie11_titulo) && (
                <div className="flex items-start gap-4 pt-2">
                  <div className="p-2 bg-slate-800/50 rounded-lg text-slate-400">
                    <Stethoscope size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diagnóstico (CIE-11)</p>
                    <div className="bg-slate-900/40 rounded-lg p-3 border border-white/5">
                      {consulta.cie11_codigo && (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-xs font-bold font-mono mb-1.5 border border-amber-500/20">
                          {consulta.cie11_codigo}
                        </span>
                      )}
                      {consulta.cie11_titulo && (
                        <p className="text-sm text-slate-300 italic">"{consulta.cie11_titulo}"</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Medicamentos Prescritos */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                <Pill size={20} />
              </span>
              Medicamentos Prescritos
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
          </div>

          <div className="space-y-4">
            {medicamentos.map((med, index) => (
              <div
                key={index}
                className="group relative bg-[#0d1f33]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 sm:p-6 hover:bg-[#0d1f33] hover:border-cyan-500/30 transition-all duration-300 shadow-lg"
              >
                {/* Visual Accent */}
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity"></div>

                <div className="pl-4">
                  {/* Header Medicamento */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-sm font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                          #{index + 1}
                        </span>
                        <h4 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                          {med.nombre_comercial}
                        </h4>
                      </div>
                      <p className="text-sm text-slate-400 italic">
                        {med.sustancia_activa}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recetado</p>
                        <p className="text-lg font-bold text-white">{med.cantidad_total}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Entregado</p>
                        <p className={`text-lg font-bold ${(med.totalSurtido ?? 0) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {med.totalSurtido || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Detalles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-2 font-semibold uppercase tracking-wider">
                        <FileText size={14} className="text-blue-400" /> Indicaciones
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        {med.indicaciones || med.dosis}
                      </p>
                    </div>

                    <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-2 font-semibold uppercase tracking-wider">
                        <Clock size={14} className="text-emerald-400" /> Tratamiento
                      </p>
                      <p className="text-base text-slate-200 font-medium">
                        {med.duracion_tratamiento_dias} días
                      </p>
                    </div>
                  </div>

                  {/* Sección de Resurtimientos */}
                  {med.realizar_resurtimiento && (
                    <div className="mt-6 pt-5 border-t border-white/5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-400">
                            <Calendar size={14} />
                          </div>
                          <h5 className="text-sm font-bold text-slate-200">
                            Programa de Resurtimiento
                          </h5>
                        </div>
                        <div className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                          Tratamiento Total: {med.totalMeses || 0} {(med.totalMeses || 0) === 1 ? 'mes' : 'meses'}
                        </div>
                      </div>

                      {/* Progress Bar Premium */}
                      <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden mb-5 shadow-inner">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                          style={{
                            width: `${((med.mesesCompletados || 0) / (med.totalMeses || 1)) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        {/* Surtimientos Completados */}
                        {med.surtimientos.length > 0 && (
                          <div className="space-y-2">
                            {med.surtimientos.map((surt, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 transition-colors hover:bg-emerald-500/10"
                              >
                                <div className="shrink-0 text-emerald-400">
                                  <CheckCircle size={18} fill="currentColor" className="text-emerald-950/30" />
                                </div>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <p className="text-sm font-medium text-emerald-200">
                                    Mes {surt.mes_resurtimiento} - Entregado
                                  </p>
                                  <span className="text-xs text-emerald-400/60 font-mono">
                                    {formatearFechaCorta(surt.fecha_surtimiento)} • {surt.cantidad_surtida} pzas
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Próximo Surtimiento */}
                        {med.proximoResurtimiento && (
                          <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 animate-pulse border-amber-500/20">
                            <div className="shrink-0 text-amber-400">
                              <Clock size={18} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-200">
                                Próximo: Mes {med.proximoResurtimiento.mes}
                              </p>
                              <p className="text-xs text-amber-400/60">
                                Fecha estimada: {formatearFechaCorta(med.proximoResurtimiento.fecha_aproximada)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Mensaje Final */}
                        {!med.proximoResurtimiento &&
                          (med.mesesCompletados || 0) === (med.totalMeses || 0) &&
                          (med.totalMeses || 0) > 0 && (
                            <div className="text-center p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                              <p className="text-sm font-medium text-blue-300 flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Tratamiento completado
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Médico Tratante */}
        {consulta.nombre_medico && (
          <div className="bg-[#0a1929] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg shadow-black/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-800 text-gray-400 shrink-0">
                <Stethoscope size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase mb-0.5 text-gray-500">
                  Médico tratante
                </p>
                <p className="text-sm sm:text-base font-medium text-gray-200 break-words">
                  {consulta.nombre_medico}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Información del sistema */}
        <div className="bg-[#0a1929] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg shadow-black/20">
          <div className="flex items-start gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-lg bg-gray-800 text-gray-400 shrink-0">
              <Shield size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-300 mb-2 break-words">
                Esta receta fue emitida el {formatearFecha(receta.fecha_emision)} y es válida por{' '}
                {receta.vigencia_dias} días.
              </p>
              <p className="text-xs text-gray-500 break-words">
                Este documento es de carácter informativo. Para cualquier duda, consulte con su médico.
              </p>
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye size={12} className="shrink-0" />
              <span className="break-words">Acceso seguro válido hasta {formatearFechaCorta(tokenInfo.fecha_expiracion)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Sistema Médico Pandora SJR 2.0
            </div>
          </div>
        </div>

      </div>

      {/* Watermark de seguridad */}
      <div className="text-center pb-2">
        <p className="text-xs text-gray-600 flex items-center justify-center gap-2 break-words px-4">
          <Shield size={12} className="shrink-0" />
          <span>Documento confidencial • No compartir este enlace</span>
        </p>
      </div>
    </div >
  );
}
