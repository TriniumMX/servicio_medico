// src/components/catalogos/usuarios-proveedores/ProveedorModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, User, Phone, Lock, Building2, CalendarDays, Eye, EyeOff } from 'lucide-react';
import { UsuarioConTipo, TipoUsuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '@/types/catalogos/usuarios-proveedores.types';
import type { Hospital } from '@/types/catalogos/hospitales';

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUsuarioDTO | UpdateUsuarioDTO) => Promise<boolean>;
  proveedor?: UsuarioConTipo | null;
  tiposUsuarios: TipoUsuario[];
  isDark: boolean;
}

export default function ProveedorModal({
  isOpen,
  onClose,
  onSubmit,
  proveedor,
  tiposUsuarios,
  isDark
}: ProveedorModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    colonia: '',
    telefono: '',
    celular: '',
    cedula_profesional: '',
    email: '',
    username: '',
    password: '',
    id_tipousuario: '',
    id_especialidad: '',
    activo: true,
    costo: '',
    id_hospital: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hospitales, setHospitales] = useState<Hospital[]>([]);
  const [loadingHospitales, setLoadingHospitales] = useState(false);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);

  // Agenda
  type AgendaDia = { dia_semana: number; hora_inicio: string; hora_fin: string };
  const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const DIAS_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const [agenda, setAgenda] = useState<AgendaDia[]>([]);

  const toggleDia = (dia: number) => {
    setAgenda(prev => {
      const existe = prev.find(a => a.dia_semana === dia);
      if (existe) return prev.filter(a => a.dia_semana !== dia);
      return [...prev, { dia_semana: dia, hora_inicio: '08:00', hora_fin: '17:00' }]
        .sort((a, b) => a.dia_semana - b.dia_semana);
    });
  };

  const updateHora = (dia: number, field: 'hora_inicio' | 'hora_fin', value: string) => {
    setAgenda(prev => prev.map(a => a.dia_semana === dia ? { ...a, [field]: value } : a));
  };

  // Cargar hospitales, especialidades y agenda al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarHospitales();
      cargarEspecialidades();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && proveedor?.id_usuario) {
      fetch(`/api/catalogos/usuarios_y_proveedores/${proveedor.id_usuario}/agenda`)
        .then(r => r.json())
        .then(d => { if (d.success) setAgenda(d.agenda || []); })
        .catch(() => {});
    } else if (isOpen && !proveedor) {
      setAgenda([]);
    }
  }, [isOpen, proveedor]);

  const cargarHospitales = async () => {
    setLoadingHospitales(true);
    try {
      const response = await fetch('/api/hospitales');
      const data = await response.json();
      if (data.success) {
        // Filtrar solo hospitales activos
        setHospitales(data.hospitales.filter((h: Hospital) => h.activo));
      }
    } catch (error) {
      console.error('Error al cargar hospitales:', error);
    } finally {
      setLoadingHospitales(false);
    }
  };

  const cargarEspecialidades = async () => {
    setLoadingEspecialidades(true);
    try {
      const response = await fetch('/api/especialidades');
      const data = await response.json();
      if (data.success) {
        // Filtrar solo especialidades activas
        setEspecialidades(data.especialidades.filter((e: any) => e.estatus));
      }
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        direccion: proveedor.direccion || '',
        colonia: proveedor.colonia || '',
        telefono: proveedor.telefono || '',
        celular: proveedor.celular || '',
        cedula_profesional: proveedor.cedula_profesional || '',
        email: proveedor.email || '',
        username: proveedor.username || '',
        password: '',
        id_tipousuario: proveedor.id_tipousuario?.toString() || '',
        id_especialidad: proveedor.id_especialidad?.toString() || '',
        activo: proveedor.activo ?? true,
        costo: proveedor.costo?.toString() || '',
        id_hospital: proveedor.id_hospital?.toString() || ''
      });
    } else {
      setFormData({
        nombre: '',
        direccion: '',
        colonia: '',
        telefono: '',
        celular: '',
        cedula_profesional: '',
        email: '',
        username: '',
        password: '',
        id_tipousuario: '',
        id_especialidad: '',
        activo: true,
        costo: '',
        id_hospital: ''
      });
    }
  }, [proveedor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend: any = {
      nombre: formData.nombre,
      direccion: formData.direccion || undefined,
      colonia: formData.colonia || undefined,
      telefono: formData.telefono || undefined,
      celular: formData.celular || undefined,
      cedula_profesional: formData.cedula_profesional || undefined,
      email: formData.email || undefined,
      username: formData.username,
      id_tipousuario: parseInt(formData.id_tipousuario),
      id_especialidad: formData.id_especialidad ? parseInt(formData.id_especialidad) : undefined,
      activo: formData.activo,
      costo: formData.costo ? parseFloat(formData.costo) : undefined,
      id_hospital: formData.id_hospital ? parseInt(formData.id_hospital) : undefined,
      agenda
    };

    // Solo incluir password si se está creando o si se modificó
    if (!proveedor || formData.password) {
      dataToSend.password = formData.password;
    }

    const success = await onSubmit(dataToSend);
    setLoading(false);

    if (success) {
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                isDark ? 'bg-[#0a1929]' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className={`sticky top-0 flex items-center justify-between p-6 border-b z-10 ${
                isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {proveedor ? 'Editar Usuario/Proveedor' : 'Nuevo Usuario/Proveedor'}
                </h2>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-[#0f83b2]/10 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Información Personal */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    <User className="h-5 w-5 text-[#0db1ec]" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: Dr. Juan Pérez López"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Tipo de Usuario *
                      </label>
                      <select
                        name="id_tipousuario"
                        value={formData.id_tipousuario}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                      >
                        <option value="">Seleccionar...</option>
                        {tiposUsuarios.map((tipo) => (
                          <option key={tipo.clavetipousuario} value={tipo.clavetipousuario}>
                            {tipo.tipousuario}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Especialidad
                      </label>
                      <select
                        name="id_especialidad"
                        value={formData.id_especialidad}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                      >
                        <option value="">Seleccionar...</option>
                        {especialidades.map((esp) => (
                          <option key={esp.claveespecialidad} value={esp.claveespecialidad}>
                            {esp.especialidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Cédula Profesional
                      </label>
                      <input
                        type="text"
                        name="cedula_profesional"
                        value={formData.cedula_profesional}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: 12345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Hospital */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    <Building2 className="h-5 w-5 text-[#0db1ec]" />
                    Hospital de Servicio
                  </h3>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Hospital donde prestará servicios
                    </label>
                    <select
                      name="id_hospital"
                      value={formData.id_hospital}
                      onChange={handleChange}
                      disabled={loadingHospitales}
                      className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                        isDark
                          ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                      } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20 disabled:opacity-50`}
                    >
                      <option value="">Seleccionar hospital...</option>
                      {hospitales.map((hospital) => (
                        <option key={hospital.id_hospital} value={hospital.id_hospital}>
                          {hospital.nombre_hospital}
                        </option>
                      ))}
                    </select>
                    {loadingHospitales && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Cargando hospitales...
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Seleccione el hospital donde este proveedor prestará sus servicios
                    </p>
                  </div>
                </div>

                {/* Agenda / Días de Consulta */}
                <div>
                  <h3 className={`text-lg font-semibold mb-1 flex items-center gap-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    <CalendarDays className="h-5 w-5 text-[#0db1ec]" />
                    Días de Consulta
                  </h3>
                  <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Selecciona los días en que este médico da consulta y el horario correspondiente
                  </p>

                  {/* Chips de días */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {DIAS_CORTO.map((dia, index) => {
                      const activo = agenda.some(a => a.dia_semana === index);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleDia(index)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            activo
                              ? 'bg-[#0db1ec] text-white shadow-md shadow-[#0db1ec]/30'
                              : isDark
                                ? 'bg-[#0d2137] border border-[#0f83b2]/30 text-gray-400 hover:border-[#0db1ec]/60 hover:text-[#0db1ec]'
                                : 'bg-gray-100 border border-gray-300 text-gray-600 hover:border-[#0db1ec] hover:text-[#0db1ec]'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rangos de horario por día seleccionado */}
                  {agenda.length > 0 ? (
                    <div className="space-y-2">
                      {agenda.map(item => (
                        <div
                          key={item.dia_semana}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                            isDark
                              ? 'bg-[#0d2137] border border-[#0f83b2]/20'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className={`w-20 text-sm font-semibold shrink-0 ${
                            isDark ? 'text-[#0db1ec]' : 'text-[#0a8ec4]'
                          }`}>
                            {DIAS_FULL[item.dia_semana]}
                          </span>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={item.hora_inicio}
                              onChange={e => updateHora(item.dia_semana, 'hora_inicio', e.target.value)}
                              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors [color-scheme:light] dark:[color-scheme:dark] ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-1 focus:ring-[#0db1ec]/30`}
                            />
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              a
                            </span>
                            <input
                              type="time"
                              value={item.hora_fin}
                              onChange={e => updateHora(item.dia_semana, 'hora_fin', e.target.value)}
                              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors [color-scheme:light] dark:[color-scheme:dark] ${
                                isDark
                                  ? 'bg-[#0a1929] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                              } focus:outline-none focus:ring-1 focus:ring-[#0db1ec]/30`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm italic ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      Ningún día seleccionado — el hospital podrá agendar en cualquier fecha
                    </p>
                  )}
                </div>

                {/* Contacto */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    <Phone className="h-5 w-5 text-[#0db1ec]" />
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: 4421234567"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Celular
                      </label>
                      <input
                        type="tel"
                        name="celular"
                        value={formData.celular}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: 4429876543"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Dirección
                      </label>
                      <input
                        type="text"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: Av. Principal #123"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Colonia
                      </label>
                      <input
                        type="text"
                        name="colonia"
                        value={formData.colonia}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: Centro"
                      />
                    </div>
                  </div>
                </div>

                {/* Acceso al Sistema */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    <Lock className="h-5 w-5 text-[#0db1ec]" />
                    Acceso al Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Usuario *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: jperez"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Contraseña {proveedor ? '(dejar vacío para no cambiar)' : '*'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required={!proveedor}
                          className={`w-full px-4 py-2.5 pr-10 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                          } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Costo de Consulta
                      </label>
                      <input
                        type="number"
                        name="costo"
                        value={formData.costo}
                        onChange={handleChange}
                        step="0.01"
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                        placeholder="Ej: 500.00"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Estado
                      </label>
                      <select
                        name="activo"
                        value={formData.activo ? '1' : '0'}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
                        } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                      >
                        <option value="S">Activo</option>
                        <option value="N">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        {proveedor ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
