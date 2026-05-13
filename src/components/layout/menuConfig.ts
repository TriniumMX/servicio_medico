import {
  LayoutDashboard, Stethoscope, User, Book, FileText, Search,
  FilePlus, Pill, Settings, ClipboardList, UserCheck, Shield, Printer, BarChart3, ArrowLeftCircle, Bell, XCircle
} from 'lucide-react';

export const menuItems = [
  // 1. DASHBOARD
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    action: 'VER_DASHBOARD'
  },

  // 1.5 EXPEDIENTE
  {
    name: 'Expediente',
    icon: Search,
    path: '/dashboard/pacientes',
    action: 'VER_CONSULTAS' // Usamos permiso de consultas para que médicos lo vean
  },

  // 2. CONSULTAS
  {
    name: 'Consultas',
    icon: Stethoscope,
    path: '/consultas',
    action: 'VER_CONSULTAS', // Permiso Padre
    subItems: [
      { name: 'Signos Vitales', path: '/dashboard/consultas/signos-vitales', action: 'TOMAR_SIGNOS_VITALES' },
      { name: 'Diagnóstico', path: '/dashboard/consultas/diagnostico', action: 'REALIZAR_DIAGNOSTICO' },
      { name: 'Diagnósticos (Prueba)', path: '/dashboard/consultas/diagnosticos-prueba', action: 'VER_DIAGNOSTICOS_PRUEBA' },
    ]
  },

  // 3. COORDINACIÓN
  {
    name: 'Coordinación',
    icon: ClipboardList,
    path: '/coordinacion',
    action: 'VER_COORDINACION',
    subItems: [
      { name: 'Autorizar estudios de laboratorio', path: '/dashboard/coordinacion/laboratorio', action: 'GESTIONAR_ORDENES_LAB' },
      { name: 'Autorizar referencias', path: '/dashboard/referencias/coordinador', action: 'GESTIONAR_REFERENCIAS' },
      { name: 'Autorizar incapacidades', path: '/dashboard/coordinacion/incapacidades', action: 'AUTORIZAR_INCAPACIDADES' }
    ]
  },

  // 3.5 GESTORES
  {
    name: 'Gestores',
    icon: Shield,
    path: '/gestores',
    action: 'ACCESO_GESTORES',
    subItems: [
      { name: 'Gestion de entrega referencias', path: '/dashboard/referencias/admin', action: 'VER_REFERENCIAS_ADMIN' },
      { name: 'Entrega Laboratorio', path: '/dashboard/admin/laboratorios', action: 'ENTREGAR_RESULTADOS_LAB' },
      { name: 'Entrega de Incapacidades', path: '/dashboard/gestores/incapacidades', action: 'ENTREGAR_INCAPACIDADES' },
    ]
  },

  // 4. ESPECIALISTA
  {
    name: 'Especialista',
    icon: User,
    path: '/especialista',
    action: 'VER_ESPECIALISTA',
    subItems: [
      { name: 'Gestionar pacientes referidos', path: '/dashboard/referencias/especialista', action: 'VER_MIS_REFERENCIAS' },
    ]
  },

  // 5. CONTRAREFERENCIAS
  {
    name: 'Contrareferencias',
    icon: ArrowLeftCircle,
    path: '/dashboard/contrareferencias/mis-contrareferencias',
    action: 'ACCESO_CONTRAREFERENCIAS'
  },

  // 6. ADMINISTRACIÓN
  {
    name: 'Administración',
    icon: Settings,
    path: '/admin',
    action: 'VER_ADMIN',
    subItems: [
      { name: 'Gestión de Accesos', path: '/dashboard/admin/permisos', action: 'GESTIONAR_PERMISOS' },
      { name: 'Gestión de Avisos', path: '/dashboard/admin/avisos', action: 'ACCESO_AVISOS' },
    ]
  },

  // 6.1 ANÁLISIS DE DATOS
  {
    name: 'Análisis de datos',
    icon: BarChart3,
    path: '/dashboard/admin/estadisticas',
    action: 'ACCESO_GRAFICAS'
  },

  // 8. CATÁLOGOS
  {
    name: 'Catálogos',
    icon: Book,
    path: '/catalogos',
    action: 'VER_CATALOGOS',
    subItems: [
      { name: 'Beneficiarios', path: '/dashboard/catalogos/beneficiarios', action: 'VER_BENEFICIARIOS' },
      { name: 'Especialidades', path: '/dashboard/catalogos/especialidades', action: 'VER_ESPECIALIDADES' },
      { name: 'Hospitales', path: '/dashboard/catalogos/hospitales', action: 'VER_HOSPITALES' },
      { name: 'Enfermedades', path: '/dashboard/catalogos/enfermedades', action: 'VER_ENFERMEDADES' },
      { name: 'Estudios Laboratorio', path: '/dashboard/catalogos/estudios_lab', action: 'VER_LABORATORIO' },
      { name: 'Usuarios y proveedores', path: '/dashboard/catalogos/usuarios_provedores', action: 'VER_USUARIOS' },
      { name: 'Tipos usuario', path: '/dashboard/catalogos/tipos_usuario', action: 'VER_TIPOS_USUARIO' },
    ]
  },

  // 9. FARMACIA
  {
    name: 'Farmacia',
    icon: Pill,
    path: '/farmacia',
    action: 'VER_FARMACIA',
    subItems: [
      { name: 'Unidades', path: '/dashboard/farmacia/unidades-medida', action: 'VER_FARMACIA_UNIDADES' },
      { name: 'Medicamentos', path: '/dashboard/farmacia/medicamentos', action: 'VER_FARMACIA_MEDICAMENTOS' },
      { name: 'Inventario', path: '/dashboard/farmacia/inventario', action: 'VER_FARMACIA_INVENTARIO' },
      { name: 'Surtimiento', path: '/dashboard/farmacia/surtimiento', action: 'VER_FARMACIA_SURTIMIENTO' },
      { name: 'Resurtimiento', path: '/dashboard/farmacia/resurtimiento', action: 'VER_FARMACIA_RESURTIMIENTO' },
      { name: 'Cancelaciones', path: '/dashboard/farmacia/cancelaciones', action: 'ACCESO_CANCELACIONES' },
      { name: 'Alertas de Fondos', path: '/dashboard/farmacia/alertas-fondos', action: 'VER_ALERTAS_FONDOS' },
    ]
  },

  // 10. OTROS
  { name: 'Capturas', icon: FilePlus, path: '/capturas', action: 'VER_CAPTURAS' },
  { name: 'Reportes', icon: FileText, path: '/reportes', action: 'VER_REPORTES' },

  // 5. REFERENCIAS
  {
    name: 'Hospital',
    icon: UserCheck,
    path: '/referencias',
    action: 'VER_REFERENCIAS',
    subItems: [
      { name: 'Asignar médico', path: '/dashboard/referencias/hospital', action: 'VER_REFERENCIAS_HOSPITAL' },
    ]
  },
];