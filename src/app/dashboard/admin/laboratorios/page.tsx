'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  PhoneCall,
  FileText,
  User,
  Calendar,
  CheckCircle,
  Search,
  CheckSquare,
  Clock,
  Ban,
  AlertCircle,
  FlaskConical,
  Filter,
  MoreVertical,
  Activity,
  ChevronRight,
  X,
  Mail,
  Smartphone
} from 'lucide-react';
import Swal from 'sweetalert2';
import { generarOrdenLaboratorioPDF } from '@/lib/generar-orden-laboratorio-pdf';
import ModalPreviewOrdenLaboratorio from '@/components/laboratorio/ModalPreviewOrdenLaboratorio';

interface OrdenLaboratorio {
  id_solicitud: number;
  id_consulta: number;
  motivo_clinico: string;
  fecha_autorizacion: string;
  estatus: 'AUTORIZADO' | 'ENTREGADO' | 'RECHAZADO';
  fecha_entrega?: string;
  motivo_rechazo?: string;
  nombre_estudio: string;
  categoria: string;
  folio_consulta: string;
  paciente_nombre: string;
  no_nomina: string;
  departamento: string;
  es_empleado: boolean;
  id_beneficiario?: number;
  medico_solicitante: string;
  coordinador_nombre: string;
  coordinador_firma: string;
  medico_firma: string;
  elaboro_nombre: string;
  edad?: number | string;
}

interface DatosContacto {
  telefono: string | null;
  correo: string | null;
  error?: string;
}

export default function CoordinacionLaboratorioPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && theme === 'dark';

  const [ordenes, setOrdenes] = useState<OrdenLaboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pendientes' | 'entregados' | 'rechazados'>('pendientes');

  // Estado para el modal de contacto
  const [selectedGrupo, setSelectedGrupo] = useState<any | null>(null);
  const [datosContacto, setDatosContacto] = useState<DatosContacto | null>(null);
  const [loadingContacto, setLoadingContacto] = useState(false);

  // Estado para PDF Preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ pacienteNombre: string; folio: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/laboratorio');
      const data = await res.json();
      if (data.success) setOrdenes(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrdenes(); }, []);

  const gruposFiltrados = useMemo(() => {
    const groups: Record<number, any> = {};

    ordenes.forEach(ord => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchNombre = ord.paciente_nombre.toLowerCase().includes(term);
        const matchNomina = ord.no_nomina.includes(term);
        if (!matchNombre && !matchNomina) return;
      }

      if (activeTab === 'pendientes' && ord.estatus !== 'AUTORIZADO') return;
      if (activeTab === 'entregados' && ord.estatus !== 'ENTREGADO') return;
      if (activeTab === 'rechazados' && ord.estatus !== 'RECHAZADO') return;

      if (!groups[ord.id_consulta]) {
        groups[ord.id_consulta] = { ...ord, estudios: [] };
      }
      groups[ord.id_consulta].estudios.push(ord);
    });

    return Object.values(groups).sort((a: any, b: any) =>
      new Date(b.fecha_autorizacion).getTime() - new Date(a.fecha_autorizacion).getTime()
    );
  }, [ordenes, searchTerm, activeTab]);

  // --- PDF ---
  const generarPDF = async (grupo: any) => {
    try {
      const diagnosticos = Array.isArray(grupo.diagnosticos_json)
        ? grupo.diagnosticos_json
        : (typeof grupo.diagnosticos_json === 'string' ? JSON.parse(grupo.diagnosticos_json) : []);

      const pdfBytes = await generarOrdenLaboratorioPDF({
        folio_consulta: grupo.folio_consulta,
        paciente_nombre: grupo.paciente_nombre,
        no_nomina: grupo.no_nomina,
        departamento: grupo.departamento,
        edad: grupo.edad,
        fecha_autorizacion: grupo.fecha_autorizacion,
        fecha_entrega: grupo.fecha_entrega,
        medico_solicitante: grupo.medico_solicitante,
        motivo_clinico: grupo.motivo_clinico, // Legacy/Fallback
        diagnosticos: diagnosticos,
        estudios: grupo.estudios.map((est: any) => ({
          nombre_estudio: est.nombre_estudio,
          motivo_clinico: est.motivo_clinico // Pass the specific motive
        })),
        coordinador_nombre: grupo.coordinador_nombre,
        coordinador_firma: grupo.coordinador_firma,
        medico_firma: grupo.medico_firma,
        elaboro_nombre: grupo.elaboro_nombre
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setPreviewPdfUrl(url);
      setPreviewData({
        pacienteNombre: grupo.paciente_nombre,
        folio: grupo.folio_consulta
      });
      setShowPreviewModal(true);

    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el PDF.',
        icon: 'error',
        confirmButtonColor: '#0db1ec'
      });
    }
  };

  const obtenerDatosContacto = async (grupo: any) => {
    setLoadingContacto(true);
    setSelectedGrupo(grupo);
    setDatosContacto(null);

    try {
      const response = await fetch('/api/obtener-datos-contacto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          es_empleado: grupo.es_empleado,
          no_nomina: grupo.no_nomina,
          id_beneficiario: grupo.id_beneficiario,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDatosContacto({
          telefono: data.telefono,
          correo: data.correo,
        });
      } else {
        // Si no hay datos, configurar mensaje de error apropiado
        if (grupo.es_empleado) {
          setDatosContacto({
            telefono: null,
            correo: null,
            error: 'empleado',
          });
        } else {
          setDatosContacto({
            telefono: null,
            correo: null,
            error: 'beneficiario',
          });
        }
      }
    } catch (error) {
      console.error('Error al obtener datos de contacto:', error);
      if (grupo.es_empleado) {
        setDatosContacto({
          telefono: null,
          correo: null,
          error: 'empleado',
        });
      } else {
        setDatosContacto({
          telefono: null,
          correo: null,
          error: 'beneficiario',
        });
      }
    } finally {
      setLoadingContacto(false);
    }
  };

  const marcarEntregado = async (grupo: any) => {
    if (!user) return;
    const ids = grupo.estudios.map((e: any) => e.id_solicitud);

    const result = await Swal.fire({
      title: '¿Confirmar Entrega?',
      text: `Se marcarán ${ids.length} estudio(s) como entregados para ${grupo.paciente_nombre}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#0a1929' : '#fff',
      color: isDark ? '#fff' : '#1f2937'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/api/admin/laboratorio/entrega', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids_solicitudes: ids, id_usuario: user.id_usuario }),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            title: 'Entregado',
            text: 'Orden marcada como entregada correctamente.',
            icon: 'success',
            confirmButtonColor: '#10b981'
          });
          fetchOrdenes();
        }
      } catch (error) { console.error(error); }
    }
  };

  const tabs = [
    { id: 'pendientes', label: 'Pendientes', icon: Clock, color: 'text-[#0db1ec]' },
    { id: 'entregados', label: 'Historial', icon: CheckCircle, color: 'text-green-600 dark:text-green-500' },
    { id: 'rechazados', label: 'Rechazados', icon: Ban, color: 'text-red-600 dark:text-red-500' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 md:p-8 space-y-8 transition-colors duration-300 ${isDark ? '' : 'bg-gray-50/50'}`}>

      {/* --- HEADER --- */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl shadow-lg shadow-[#0db1ec]/20 ${isDark ? 'bg-gradient-to-br from-[#0f83b2] to-[#0a1929] border border-[#0f83b2]/30'
            : 'bg-gradient-to-br from-[#0db1ec] to-[#0f83b2]'
            }`}>
            <FlaskConical className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Laboratorio
            </h1>
            <p className={`mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Gestión y entrega de resultados
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          {/* Buscador */}
          <div className={`relative group w-full sm:w-80 transition-all focus-within:w-full sm:focus-within:w-96`}>
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDark ? 'text-gray-400 group-focus-within:text-[#0db1ec]' : 'text-gray-400 group-focus-within:text-[#0f83b2]'
              }`}>
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por paciente o nómina..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`block w-full pl-11 pr-4 py-3 rounded-xl border-0 text-sm font-medium ring-1 ring-inset transition-all
                        focus:ring-2 focus:ring-inset sm:leading-6
                        ${isDark
                  ? 'bg-[#0a1929] text-gray-100 ring-gray-700 focus:ring-[#0db1ec] placeholder:text-gray-500'
                  : 'bg-white text-gray-900 ring-gray-200 focus:ring-[#0f83b2] shadow-sm placeholder:text-gray-400'
                }
                    `}
            />
          </div>
        </div>
      </motion.div>

      {/* --- TABS --- */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 outline-none
                        ${isActive
                  ? 'text-white !text-white' // !text-white to force override
                  : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-900')
                }
                    `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className={`absolute inset-0 rounded-full shadow-md ${isDark ? 'bg-[#0f83b2]' : 'bg-[#0db1ec]'
                    }`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={18} className={isActive ? 'text-white' : tab.color} />
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* --- CONTENT GRID --- */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0db1ec] mb-4"></div>
            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando órdenes...</p>
          </motion.div>
        ) : gruposFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center text-center py-24 px-4 rounded-3xl border border-dashed
                    ${isDark ? 'border-gray-800 bg-[#0a1929]/50' : 'border-gray-300 bg-white/50'}
                `}
          >
            <div className={`p-6 rounded-full mb-6 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
              <Filter className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No se encontraron órdenes
            </h3>
            <p className={`mt-2 max-w-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay solicitudes que coincidan con tu búsqueda en esta sección.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {gruposFiltrados.map((grupo: any) => (
              <motion.div
                key={grupo.id_consulta}
                variants={itemVariants}
                className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                            ${isDark
                    ? 'bg-[#0a1929] border border-[#0f83b2]/20 shadow-lg shadow-black/20 hover:border-[#0f83b2]/50'
                    : 'bg-white border border-gray-100 shadow-lg shadow-gray-200/50 hover:border-[#0db1ec]/30'
                  }
                        `}
              >
                {/* Status Bar Indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full 
                            ${activeTab === 'rechazados' ? 'bg-red-500' : (
                    activeTab === 'entregados' ? 'bg-green-500' : 'bg-[#0db1ec]'
                  )}
                        `} />

                <div className="p-6 pb-4">
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1
                                        ${isDark ? 'text-gray-400' : 'text-gray-500'}
                                    `}>
                        <User size={12} /> {grupo.no_nomina}
                      </div>
                      <h3 className={`font-bold text-lg leading-tight line-clamp-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {grupo.paciente_nombre}
                      </h3>
                      <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`}>
                        {grupo.departamento}
                      </p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border
                                    ${activeTab === 'pendientes'
                        ? (isDark ? 'bg-blue-900/20 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100')
                        : activeTab === 'entregados'
                          ? (isDark ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-100')
                          : (isDark ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-100')
                      }
                                `}>
                      {activeTab === 'pendientes' ? 'Pendiente' : (activeTab === 'entregados' ? 'Entregado' : 'Rechazado')}
                    </div>
                  </div>

                  {/* Informacion Extra */}
                  <div className={`space-y-3 mb-4 pl-2 border-l-2 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="pl-3">
                      <p className={`text-[10px] uppercase font-bold mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fecha Solicitud</p>
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Calendar size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        {new Date(grupo.fecha_autorizacion).toLocaleDateString()}
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(grupo.fecha_autorizacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {activeTab === 'entregados' && grupo.fecha_entrega && (
                      <div className="pl-3">
                        <p className="text-[10px] uppercase text-green-600/70 font-bold mb-0.5">Fecha Entrega</p>
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                          <CheckCircle size={14} />
                          {new Date(grupo.fecha_entrega).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {activeTab === 'rechazados' && (
                      <div className="pl-3 bg-red-50/50 dark:bg-red-900/10 p-2 rounded-r-lg">
                        <p className="text-[10px] uppercase text-red-600/70 dark:text-red-400/70 font-bold mb-0.5 flex items-center gap-1">
                          <AlertCircle size={10} /> Motivo Rechazo
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 font-medium italic">
                          "{grupo.motivo_rechazo || grupo.estudios[0]?.motivo_rechazo || "Sin motivo"}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estudios Tags */}
                  <div className="pl-2">
                    <p className={`text-[10px] uppercase font-bold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Estudios Solicitados</p>
                    <div className="flex flex-wrap gap-1.5">
                      {grupo.estudios.slice(0, 3).map((est: any, idx: number) => (
                        <span key={idx} className={`text-xs px-2 py-1 rounded-md font-medium border
                                            ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200'}
                                        `}>
                          {est.nombre_estudio}
                        </span>
                      ))}
                      {grupo.estudios.length > 3 && (
                        <span className={`text-xs px-2 py-1 rounded-md font-bold
                                            ${isDark ? 'bg-[#0db1ec]/10 text-[#0db1ec]' : 'bg-blue-50 text-blue-600'}
                                        `}>
                          +{grupo.estudios.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className={`mt-auto p-4 border-t flex items-center justify-between gap-3
                            ${isDark ? 'border-[#0f83b2]/20 bg-[#0d2137]/50' : 'border-gray-100 bg-gray-50/80'}
                        `}>
                  {activeTab !== 'rechazados' ? (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => obtenerDatosContacto(grupo)}
                          className={`p-2 rounded-lg transition-colors
                                                ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}
                                            `}
                          title="Ver Contacto"
                        >
                          <PhoneCall size={18} />
                        </button>
                        <button
                          onClick={() => generarPDF(grupo)}
                          className={`p-2 rounded-lg transition-colors
                                                ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}
                                            `}
                          title="Imprimir Orden"
                        >
                          <Printer size={18} />
                        </button>
                      </div>

                      {activeTab === 'pendientes' && (
                        <button
                          onClick={() => marcarEntregado(grupo)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#0db1ec] hover:bg-[#0f83b2] text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95"
                        >
                          <span>Entregar</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center">
                      <span className="text-xs font-medium text-gray-400">Acciones no disponibles</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM CONTACT MODAL --- */}
      <AnimatePresence>
        {selectedGrupo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => {
                setSelectedGrupo(null);
                setDatosContacto(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-2xl shadow-2xl border
                 ${isDark
                  ? 'bg-[#0a1828] border-[#0f83b2]/30'
                  : 'bg-white border-gray-100'
                }
              `}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Datos de Contacto
                </h3>
                <button onClick={() => {
                  setSelectedGrupo(null);
                  setDatosContacto(null);
                }} className={`p-1 rounded-full ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <X size={20} />
                </button>
              </div>

              <div className={`p-5 rounded-xl mb-6 flex flex-col items-center text-center
                 ${isDark ? 'bg-[#0d2137] border-t-4 border-[#0db1ec]' : 'bg-blue-50 border-t-4 border-[#0db1ec]'}
              `}>
                <div className={`p-4 rounded-full mb-3 ${isDark ? 'bg-[#0f83b2]/20 text-[#0db1ec]' : 'bg-white text-[#0f83b2] shadow-sm'}`}>
                  <User size={40} />
                </div>
                <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedGrupo.paciente_nombre}</h4>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No. Nómina: {selectedGrupo.no_nomina}</p>
              </div>

              <div className="space-y-4">
                {loadingContacto ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0db1ec] mb-3"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cargando datos de contacto...</p>
                  </div>
                ) : datosContacto?.error ? (
                  <div className={`p-4 rounded-xl border-l-4 ${isDark ? 'bg-yellow-900/20 border-yellow-500' : 'bg-yellow-50 border-yellow-500'}`}>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-yellow-500 mt-0.5" size={20} />
                      <div>
                        <p className={`text-sm font-bold mb-2 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          {datosContacto.error === 'empleado' ? 'Sin información de contacto del empleado' : 'Sin datos de contacto del beneficiario'}
                        </p>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-yellow-200/90' : 'text-yellow-600'}`}>
                          {datosContacto.error === 'empleado'
                            ? 'No se encontró información de contacto de este empleado, favor de comunicarlo a RH para que hagan la actualización de datos y Pandora pueda obtener los datos de contacto.'
                            : 'No hay datos de contacto para este beneficiario. Vaya al módulo de beneficiarios > coloque la nómina del empleado > busque el beneficiario > seleccione actualizar > coloque el teléfono o email o ambos.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center gap-4 p-4 rounded-xl transition-colors
                       ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}
                    `}>
                      <div className={`p-2.5 rounded-full ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Teléfono Móvil</p>
                        <p className={`font-medium ${datosContacto?.telefono ? (isDark ? 'text-gray-200' : 'text-gray-800') : 'text-gray-400 italic'}`}>
                          {datosContacto?.telefono || 'No registrado'}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-4 p-4 rounded-xl transition-colors
                       ${isDark ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'}
                    `}>
                      <div className={`p-2.5 rounded-full ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Correo Electrónico</p>
                        <p className={`font-medium ${datosContacto?.correo ? (isDark ? 'text-gray-200' : 'text-gray-800') : 'text-gray-400 italic'}`}>
                          {datosContacto?.correo || 'No registrado'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    setSelectedGrupo(null);
                    setDatosContacto(null);
                  }}
                  className="w-full py-3 bg-[#0db1ec] hover:bg-[#0f83b2] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ModalPreviewOrdenLaboratorio
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        pdfUrl={previewPdfUrl}
        pacienteNombre={previewData?.pacienteNombre || ''}
        folio={previewData?.folio || ''}
      />

    </div>
  );
}
