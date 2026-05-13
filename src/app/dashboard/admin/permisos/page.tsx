'use client';

import { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Shield, Search, Save, CheckSquare, Square, User, Filter, Lock, LayoutDashboard, Stethoscope, Book, Settings, ClipboardList, Pill, FileText, FilePlus, UserCheck, Printer, ArrowLeftCircle, BarChart3, Bell } from 'lucide-react';
import { usePermisos } from '@/hooks/admin/usePermisos';

export default function GestionPermisosPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { usuarios, roles, acciones, mapaPermisos, loading, guardarPermisosUsuario } = usePermisos();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  const [selectedActions, setSelectedActions] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newActionKey, setNewActionKey] = useState('');
  const [newActionDesc, setNewActionDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // ========================================================================
  // MAPA EXACTO DE PERMISOS - ORDENADO SEGÚN EL SIDEBAR
  // ========================================================================
  const SECCIONES_ORDENADAS = [
    // 1. DASHBOARD
    {
      titulo: 'DASHBOARD',
      icono: <LayoutDashboard size={16} />,
      claves: ['VER_DASHBOARD', 'VER_METRICAS_DASHBOARD']
    },
    // 2. CONSULTAS
    {
      titulo: 'CONSULTAS',
      icono: <Stethoscope size={16} />,
      claves: [
        'VER_CONSULTAS',
        'TOMAR_SIGNOS_VITALES',
        'REALIZAR_DIAGNOSTICO',
        'VER_DIAGNOSTICOS_PRUEBA',
      ]
    },
    // 3. COORDINACIÓN
    {
      titulo: 'COORDINACIÓN',
      icono: <ClipboardList size={16} />,
      claves: [
        'VER_COORDINACION',
        'VER_COORDINACION_LAB',
        'GESTIONAR_ORDENES_LAB',
        'GESTIONAR_REFERENCIAS',
        'AUTORIZAR_INCAPACIDADES',
        'ACCESO_CANCELACIONES',
      ]
    },
    // 4. GESTORES
    {
      titulo: 'GESTORES',
      icono: <Shield size={16} />,
      claves: [
        'ACCESO_GESTORES',
        'VER_REFERENCIAS_ADMIN',
        'ENTREGAR_RESULTADOS_LAB',
        'VER_MIS_INCAPACIDADES',
        'ENTREGAR_INCAPACIDADES',
      ]
    },
    // 5. ESPECIALISTA
    {
      titulo: 'ESPECIALISTA',
      icono: <User size={16} />,
      claves: [
        'VER_ESPECIALISTA',
        'VER_MIS_REFERENCIAS',
      ]
    },
    // 6. CONTRAREFERENCIAS
    {
      titulo: 'CONTRAREFERENCIAS',
      icono: <ArrowLeftCircle size={16} />,
      claves: [
        'ACCESO_CONTRAREFERENCIAS',
      ]
    },
    // 7. ADMINISTRACIÓN
    {
      titulo: 'ADMINISTRACIÓN',
      icono: <Settings size={16} />,
      claves: [
        'VER_ADMIN',
        'GESTIONAR_PERMISOS',
        'ACCESO_AVISOS',
        'GESTIONAR_CATALOGO_LAB',
      ]
    },
    // 8. ANÁLISIS DE DATOS
    {
      titulo: 'ANÁLISIS DE DATOS',
      icono: <BarChart3 size={16} />,
      claves: [
        'ACCESO_GRAFICAS',
      ]
    },
    // 9. CATÁLOGOS
    {
      titulo: 'CATÁLOGOS',
      icono: <Book size={16} />,
      claves: [
        'VER_CATALOGOS',
        'VER_BENEFICIARIOS',
        'VER_ESPECIALIDADES',
        'VER_HOSPITALES',
        'VER_ENFERMEDADES',
        'VER_LABORATORIO',
        'VER_USUARIOS',
        'VER_TIPOS_USUARIO',
      ]
    },
    // 10. FARMACIA
    {
      titulo: 'FARMACIA',
      icono: <Pill size={16} />,
      claves: [
        'VER_FARMACIA',
        'VER_FARMACIA_UNIDADES',
        'VER_FARMACIA_MEDICAMENTOS',
        'VER_FARMACIA_INVENTARIO',
        'VER_FARMACIA_SURTIMIENTO',
        'VER_FARMACIA_RESURTIMIENTO',
        'VER_ALERTAS_FONDOS',
      ]
    },
    // 11. CAPTURAS
    {
      titulo: 'CAPTURAS',
      icono: <FilePlus size={16} />,
      claves: ['VER_CAPTURAS']
    },
    // 12. REPORTES
    {
      titulo: 'REPORTES',
      icono: <FileText size={16} />,
      claves: ['VER_REPORTES']
    },
    // 13. HOSPITAL
    {
      titulo: 'HOSPITAL',
      icono: <UserCheck size={16} />,
      claves: [
        'VER_REFERENCIAS',
        'VER_REFERENCIAS_HOSPITAL',
      ]
    },
    // 14. NOTIFICACIONES
    {
      titulo: 'NOTIFICACIONES',
      icono: <Bell size={16} />,
      claves: [
        'ACCESO_NOTIFICACIONES_AVISOS',
        'NOTIF_COORD_SOLICITUDES',
        'NOTIF_HOSPITAL_REFERENCIA',
        'NOTIF_GESTOR_ENTREGA',
      ]
    },
  ];

  // Filtrado de usuarios
  const filteredUsers = usuarios.filter(u => {
    const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === '' || u.id_tipousuario.toString() === filterRole;
    return matchesSearch && matchesRole;
  });

  // Lógica de Agrupación Dinámica
  const groupedActions = useMemo(() => {
    const accionesDisponibles = [...acciones];
    const accionesClasificadas = new Set<string>();

    // 1. Grupos definidos
    const groups = SECCIONES_ORDENADAS.map(seccion => {
      const accionesDeSeccion = accionesDisponibles.filter(a => {
        if (seccion.claves.includes(a.clave)) {
          accionesClasificadas.add(a.clave);
          return true;
        }
        return false;
      });

      return {
        titulo: seccion.titulo,
        icono: seccion.icono,
        acciones: accionesDeSeccion
      };
    }).filter(grupo => grupo.acciones.length > 0);

    // 2. Grupo "OTROS" para acciones nuevas/dinámicas
    const accionesSinClasificar = accionesDisponibles.filter(a => !accionesClasificadas.has(a.clave));

    if (accionesSinClasificar.length > 0) {
      groups.push({
        titulo: 'OTROS / SIN CLASIFICAR',
        icono: <CheckSquare size={16} />,
        acciones: accionesSinClasificar
      });
    }

    return groups;
  }, [acciones, SECCIONES_ORDENADAS]); // Dependencia SECCIONES_ORDENADAS importante si cambia (aunque es const aquí)

  const handleSelectUser = (id: number) => {
    setSelectedUserId(id);
    setSelectedActions(mapaPermisos[id] || []);
    setShowMobilePanel(true);
  };

  const toggleAction = (id_accion: number) => {
    setSelectedActions(prev =>
      prev.includes(id_accion) ? prev.filter(id => id !== id_accion) : [...prev, id_accion]
    );
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    await guardarPermisosUsuario(selectedUserId, selectedActions);
    setIsSaving(false);
  };

  const handleCreateAction = async () => {
    if (!newActionKey.trim() || !newActionDesc.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/acciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: newActionKey, descripcion: newActionDesc })
      });

      const data = await res.json();
      if (data.success) {
        alert('Acción creada correctamente. Recarga la página para verla en la lista.');
        setIsModalOpen(false);
        setNewActionKey('');
        setNewActionDesc('');
        // Idealmente aquí recargaríamos las acciones sin reload, pero por simplicidad pedimos reload o usamos un reload del hook
        window.location.reload();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creando acción', error);
      alert('Error al crear la acción');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleAll = () => {
    if (selectedActions.length === acciones.length) {
      setSelectedActions([]);
    } else {
      setSelectedActions(acciones.map(a => a.id_accion));
    }
  };

  return (
    <div className={`p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col ${isDark ? "bg-[#0d2137]" : "bg-gray-50/50"}`}>
      {/* Header */}
      <div className={`rounded-xl shadow-lg p-6 mb-6 shrink-0 border relative overflow-hidden transition-all ${isDark ? "bg-[#0a1929] border-[#0f83b2]/20" : "bg-white border-gray-200"
        } ${showMobilePanel ? 'hidden lg:block' : 'block'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-lg shadow-blue-500/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Control de Accesos
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Gestión centralizada de permisos y roles de usuario
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${isDark
              ? 'bg-[#0f83b2]/10 text-[#0db1ec] border border-[#0f83b2]/30 hover:bg-[#0f83b2]/20 shadow-blue-900/10'
              : 'bg-white text-[#0f83b2] border border-blue-100 hover:bg-blue-50 shadow-blue-500/5'
              }`}
          >
            <FilePlus size={18} />
            Crear Nueva Acción
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-12 gap-6">

          {/* COLUMNA IZQUIERDA: Lista de Usuarios */}
          <div className={`flex-col rounded-2xl border overflow-hidden shadow-sm h-full lg:col-span-4 ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
            } ${showMobilePanel ? 'hidden lg:flex' : 'flex'}`}>
            {/* Filtros */}
            <div className={`p-4 border-b space-y-3 ${isDark ? 'border-[#0f83b2]/20 bg-[#0d2137]/30' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${isDark
                    ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec] focus:ring-1 focus:ring-[#0db1ec]'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]'
                    }`}
                />
              </div>

              <div className="relative">
                <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium appearance-none transition-all outline-none ${isDark
                    ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec] focus:ring-1 focus:ring-[#0db1ec]'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]'
                    }`}
                >
                  <option value="">Todos los roles</option>
                  {roles.map(rol => (
                    <option key={rol.clavetipousuario} value={rol.clavetipousuario}>
                      {rol.tipousuario}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f83b2]"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className={`w-12 h-12 mx-auto mb-2 opacity-20 ${isDark ? "text-white" : "text-gray-900"}`} />
                  <p className="text-sm text-gray-500">No se encontraron usuarios.</p>
                </div>
              ) : filteredUsers.map(user => (
                <button
                  key={user.id_usuario}
                  onClick={() => handleSelectUser(user.id_usuario)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${selectedUserId === user.id_usuario
                    ? isDark
                      ? 'bg-[#0f83b2]/20 border-[#0f83b2] shadow-md shadow-blue-900/20'
                      : 'bg-blue-50 border-[#0f83b2] shadow-sm'
                    : isDark
                      ? 'border-transparent text-gray-400 hover:bg-[#0d2137] hover:border-[#0f83b2]/20'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedUserId === user.id_usuario
                    ? 'bg-[#0f83b2] text-white shadow-lg shadow-blue-500/30'
                    : isDark ? 'bg-[#0d2137] text-gray-500' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`font-bold text-sm truncate ${selectedUserId === user.id_usuario
                        ? isDark ? 'text-white' : 'text-[#0f83b2]'
                        : isDark ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                        {user.nombre}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isDark ? "bg-[#0d2137] text-gray-400" : "bg-gray-100 text-gray-500"
                        }`}>
                        {user.nombre_rol?.substring(0, 10)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* COLUMNA DERECHA: Panel de Permisos (Mobile: Visible solo si showMobilePanel) */}
          <div className={`flex-col rounded-2xl border overflow-hidden shadow-sm h-full lg:col-span-8 ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
            } ${showMobilePanel ? 'flex' : 'hidden lg:flex'}`}>
            {selectedUserId ? (
              <>
                <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b flex flex-col gap-4 shrink-0 ${isDark ? 'border-[#0f83b2]/20 bg-[#0d2137]/30' : 'border-gray-100 bg-gray-50/50'}`}>
                  {/* Header Permisos con Botón Back en Mobile */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobilePanel(false)}
                      className={`lg:hidden p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-gray-200 text-gray-800"
                        }`}
                    >
                      <ArrowLeftCircle className="w-6 h-6" />
                    </button>

                    <div className={`p-2 rounded-lg ${isDark ? "bg-[#0f83b2]/10" : "bg-blue-50"}`}>
                      <UserCheck className={`w-5 h-5 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {usuarios.find(u => u.id_usuario === selectedUserId)?.nombre}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Editando permisos
                        </p>
                        <span className={`h-1 w-1 rounded-full bg-gray-500`}></span>
                        <span className={`text-xs font-bold ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`}>
                          {selectedActions.length} activos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={toggleAll}
                      className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-colors ${isDark
                        ? 'border-gray-700 hover:bg-gray-800 text-gray-400'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                      {selectedActions.length === acciones.length ? 'Desmarcar Todo' : 'Marcar Todo'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${isDark
                        ? 'bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:to-[#0db1ec] shadow-blue-900/20'
                        : 'bg-gradient-to-r from-[#0f83b2] to-[#0a7aa0] hover:to-[#0a7aa0] shadow-blue-500/20'
                        } disabled:opacity-50`}
                    >
                      <Save size={16} />
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-dots-pattern">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groupedActions.map((group) => (
                      <div key={group.titulo} className={`rounded-2xl border p-1 ${isDark ? 'border-[#0f83b2]/20 bg-[#0d2137]/40' : 'border-gray-100 bg-white'}`}>
                        <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'border-[#0f83b2]/10' : 'border-gray-50'}`}>
                          <span className={isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}>{group.icono}</span>
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {group.titulo}
                          </h4>
                        </div>
                        <div className="p-2 space-y-1">
                          {group.acciones.map((accion: any) => {
                            const isSelected = selectedActions.includes(accion.id_accion);
                            return (
                              <div
                                key={accion.id_accion}
                                onClick={() => toggleAction(accion.id_accion)}
                                className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                  ? (isDark ? 'bg-[#0f83b2]/10 border-[#0f83b2]/30' : 'bg-blue-50 border-[#0f83b2]/30')
                                  : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[#0f83b2]/5'
                                  }`}
                              >
                                <div className={`mt-0.5 shrink-0 transition-colors ${isSelected ? (isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]') : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400'}`}>
                                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <div>
                                  <p className={`text-xs font-bold font-mono mb-0.5 ${isSelected ? (isDark ? 'text-white' : 'text-[#0f83b2]') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                                    {accion.clave}
                                  </p>
                                  <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {accion.descripcion}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className={`p-6 rounded-full mb-6 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
                  <UserCheck size={64} className={`opacity-20 ${isDark ? "text-white" : "text-gray-900"}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Selecciona un Usuario
                </h3>
                <p className={`max-w-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Haz clic en un usuario del panel izquierdo para visualizar y editar sus permisos de acceso al sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CREAR ACCIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#0a1929] border border-[#0f83b2]/30' : 'bg-white'
            }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDark ? "bg-[#0d2137] border-[#0f83b2]/20" : "bg-gray-50 border-gray-100"}`}>
              <div className={`p-2 rounded-lg ${isDark ? "bg-[#0f83b2]/20" : "bg-blue-100"}`}>
                <FilePlus className={`w-5 h-5 ${isDark ? "text-[#0db1ec]" : "text-[#0f83b2]"}`} />
              </div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Crear Nueva Acción
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Clave de Acción
                </label>
                <input
                  type="text"
                  value={newActionKey}
                  onChange={e => setNewActionKey(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  placeholder="Ej: VER_DASHBOARD"
                  className={`w-full p-3 rounded-xl border text-sm font-mono transition-all outline-none ${isDark
                    ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec] focus:ring-1 focus:ring-[#0db1ec]'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]'
                    }`}
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  Se convertirá automáticamente a mayúsculas y guiones bajos.
                </p>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Descripción
                </label>
                <textarea
                  value={newActionDesc}
                  onChange={e => setNewActionDesc(e.target.value)}
                  placeholder="Describe brevemente qué permite esta acción..."
                  rows={3}
                  className={`w-full p-3 rounded-xl border text-sm transition-all outline-none resize-none ${isDark
                    ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec] focus:ring-1 focus:ring-[#0db1ec]'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#0f83b2] focus:ring-1 focus:ring-[#0f83b2]'
                    }`}
                />
              </div>
            </div>

            <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? "border-[#0f83b2]/20 bg-[#0d2137]/50" : "border-gray-100 bg-gray-50"}`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${isDark
                  ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAction}
                disabled={isCreating || !newActionKey || !newActionDesc}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${isDark
                  ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] hover:to-[#0db1ec] shadow-blue-900/20"
                  : "bg-gradient-to-r from-[#0f83b2] to-[#0a7aa0] hover:to-[#0a7aa0] shadow-blue-500/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCreating ? 'Guardando...' : 'Confirmar Creación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}