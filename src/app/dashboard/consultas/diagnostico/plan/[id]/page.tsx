"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  CacheNotaMedica,
  OpcionesPlan,
  Medicamento,
  MedicamentoRecetado,
  DatosMedicamentos,
} from "@/types/consultas";
import {
  ArrowLeft,
  Pill,
  FileText,
  UserPlus,
  FlaskConical,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Stethoscope
} from "lucide-react";
import FormularioMedicamento from "@/components/consultas/medicamentos/FormularioMedicamento";
import ModalReceta from "@/components/recetas/ModalReceta";
import ModalAccionPostConsulta from "@/components/referencias/especialista/ModalAccionPostConsulta";
import Image from "next/image";

const CACHE_KEY = "nota_medica_en_progreso";

export default function PlanTratamientoPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const id = params.id as string;

  // Estado de opciones (qué módulos están habilitados)
  const [opciones, setOpciones] = useState<OpcionesPlan>({
    medicamentos: false,
    incapacidad: false,
    especialidad: false,
    laboratorio: false,
  });

  // Estado de expansión de secciones
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    medicamentos: true,
    incapacidad: true,
    especialidad: true,
    laboratorio: true,
  });

  const [incapacidadData, setIncapacidadData] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    dias_totales: 0,
    motivo: "",
    // Diagnóstico CIE-11 como motivo de incapacidad
    diagnostico_codigo: "",
    diagnostico_titulo: "",
  });

  // Diagnósticos disponibles (cargados del SOAP)
  const [diagnosticosDisponibles, setDiagnosticosDisponibles] = useState<any[]>([]);

  useEffect(() => {
    if (incapacidadData.fecha_inicio && incapacidadData.fecha_fin) {
      const inicio = new Date(incapacidadData.fecha_inicio);
      const fin = new Date(incapacidadData.fecha_fin);

      // Calcular diferencia
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setIncapacidadData(prev => ({
        ...prev,
        dias_totales: diffDays > 0 ? diffDays : 0
      }));
    } else {
      setIncapacidadData(prev => ({ ...prev, dias_totales: 0 }));
    }
  }, [incapacidadData.fecha_inicio, incapacidadData.fecha_fin]);

  // Estados para Medicamentos
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [medicamentosRecetados, setMedicamentosRecetados] = useState<
    MedicamentoRecetado[]
  >([
    {
      id_temp: Date.now().toString(),
      clavemedicamento: "",
      nombre_medicamento: "",
      indicaciones: "",
      tratamiento_dias: 7,
      piezas: 1,
      realizar_resurtimiento: false,
      meses_resurtimiento: null,
    },
  ]);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true);

  const [loading, setLoading] = useState(true);

  // Estados para loader y modal de receta
  const [showLoader, setShowLoader] = useState(false);
  const [showModalReceta, setShowModalReceta] = useState(false);
  const [recetaGenerada, setRecetaGenerada] = useState<any>(null);

  const [catalogoLab, setCatalogoLab] = useState<any[]>([]);
  const [estudiosLab, setEstudiosLab] = useState<any[]>([]);

  const [labSeleccionadoId, setLabSeleccionadoId] = useState("");
  const [labMotivo, setLabMotivo] = useState("");

  // Estados para Referencias a Especialidad
  const [catalogoEspecialidades, setCatalogoEspecialidades] = useState<any[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [motivoReferencia, setMotivoReferencia] = useState("");
  const [nivelTriage, setNivelTriage] = useState<number | null>(null);
  const [idHospitalMedico, setIdHospitalMedico] = useState<number | null>(null);

  const cargarCatalogoLab = async () => {
    try {
      const res = await fetch("/api/catalogos/laboratorio");
      const data = await res.json();
      if (data.success) {
        // Filtramos solo los activos
        setCatalogoLab(data.data.filter((e: any) => e.activo));
      }
    } catch (error) {
      console.error("Error cargando laboratorio:", error);
    }
  };

  const cargarCatalogoEspecialidades = async (hospitalId?: number | null) => {
    try {
      const url = hospitalId
        ? `/api/catalogos/especialidades?id_hospital=${hospitalId}`
        : "/api/catalogos/especialidades";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCatalogoEspecialidades(data.data.filter((e: any) => e.estatus));
      }
    } catch (error) {
      console.error("Error cargando especialidades:", error);
    }
  };

  const agregarEstudioLab = () => {
    if (!labSeleccionadoId) return alert("Seleccione un estudio");
    if (!labMotivo.trim()) return alert("El motivo es obligatorio");

    const estudioOriginal = catalogoLab.find(e => e.id_estudio.toString() === labSeleccionadoId);
    if (!estudioOriginal) return;

    if (estudiosLab.some(e => e.id_estudio === estudioOriginal.id_estudio)) {
      return alert("Este estudio ya está en la lista");
    }

    const nuevoEstudio = {
      id_temp: Date.now().toString(),
      id_estudio: estudioOriginal.id_estudio,
      nombre_estudio: estudioOriginal.nombre_estudio,
      motivo: labMotivo
    };

    setEstudiosLab([...estudiosLab, nuevoEstudio]);
    setLabSeleccionadoId('');
    setLabMotivo('');
  };

  const eliminarEstudioLab = (id_temp: string) => {
    setEstudiosLab(estudiosLab.filter(e => e.id_temp !== id_temp));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      cargarDatosIniciales();
      cargarCatalogoLab();
      // Obtener hospital del médico logueado antes de cargar especialidades
      fetch("/api/auth/me")
        .then(r => r.json())
        .then(data => {
          const hospital = data?.user?.id_hospital ?? null;
          setIdHospitalMedico(hospital);
          cargarCatalogoEspecialidades(hospital);
        })
        .catch(() => cargarCatalogoEspecialidades());
    }
  }, [mounted]);

  const isDark = mounted && theme === "dark";

  // Modal post-consulta (solo si la consulta viene de una referencia)
  const [idReferenciaOrigen, setIdReferenciaOrigen] = useState<number | null>(null);
  const [showModalAccion, setShowModalAccion] = useState(false);

  const cargarDatosIniciales = async () => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (cacheStr) {
        const cache: CacheNotaMedica = JSON.parse(cacheStr);

        // Si la consulta viene de una referencia, guardar el id para el modal post-consulta
        if (cache.datos_soap?.paciente?.id_referencia_origen) {
          setIdReferenciaOrigen(cache.datos_soap.paciente.id_referencia_origen);
        }

        // Verificar que tengamos los datos SOAP
        if (!cache.datos_soap) {
          alert(
            "Error: No se encontraron los datos del SOAP. Por favor, complete la Hoja 1 primero."
          );
          router.push(`/dashboard/consultas/diagnostico/atender/${id}`);
          return;
        }

        // Cargar diagnósticos del SOAP para usarlos en incapacidad
        if (cache.datos_soap.diagnosticos && cache.datos_soap.diagnosticos.length > 0) {
          setDiagnosticosDisponibles(cache.datos_soap.diagnosticos);
        }

        // Cargar opciones del plan si existen
        if (cache.datos_plan) {
          setOpciones(cache.datos_plan.opciones);

          // Cargar medicamentos recetados si existen
          if (
            cache.datos_plan.medicamentos &&
            cache.datos_plan.medicamentos.medicamentos.length > 0
          ) {
            setMedicamentosRecetados(
              cache.datos_plan.medicamentos.medicamentos
            );
          }
          if (cache.datos_plan.incapacidad) {
            setIncapacidadData({
              fecha_inicio: cache.datos_plan.incapacidad.fecha_inicio,
              fecha_fin: cache.datos_plan.incapacidad.fecha_fin,
              dias_totales: cache.datos_plan.incapacidad.dias, // Mapeamos 'dias' a 'dias_totales'
              motivo: cache.datos_plan.incapacidad.motivo || "",
              diagnostico_codigo: cache.datos_plan.incapacidad.diagnostico_codigo || "",
              diagnostico_titulo: cache.datos_plan.incapacidad.diagnostico_titulo || "",
            });
          }

        }

      } else {
        alert(
          "Error: No se encontró información en caché. Por favor, inicie la consulta nuevamente."
        );
        router.push("/dashboard/consultas/diagnostico");
      }

      // Cargar lista de medicamentos
      await cargarMedicamentos();

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      setLoading(false);
    }
  };

  const cargarMedicamentos = async () => {
    setLoadingMedicamentos(true);
    try {
      const response = await fetch("/api/medicamentos");
      const data = await response.json();

      if (data.success) {
        setMedicamentos(data.medicamentos);
      }
    } catch (error) {
      console.error("Error al cargar medicamentos:", error);
    } finally {
      setLoadingMedicamentos(false);
    }
  };

  const toggleSeccion = (seccion: keyof OpcionesPlan) => {
    setOpciones((prev) => ({
      ...prev,
      [seccion]: !prev[seccion],
    }));
  };

  const toggleExpansion = (seccion: keyof typeof seccionesExpandidas) => {
    setSeccionesExpandidas((prev) => ({
      ...prev,
      [seccion]: !prev[seccion],
    }));
  };

  // Funciones para medicamentos
  const agregarMedicamento = () => {
    const nuevoMedicamento: MedicamentoRecetado = {
      id_temp: Date.now().toString(),
      clavemedicamento: "",
      nombre_medicamento: "",
      indicaciones: "",
      tratamiento_dias: 7,
      piezas: 1,
      realizar_resurtimiento: false,
      meses_resurtimiento: null,
    };
    setMedicamentosRecetados([...medicamentosRecetados, nuevoMedicamento]);
  };

  const actualizarMedicamento = (
    index: number,
    medicamento: MedicamentoRecetado
  ) => {
    const nuevos = [...medicamentosRecetados];
    nuevos[index] = medicamento;
    setMedicamentosRecetados(nuevos);
  };

  const eliminarMedicamento = (index: number) => {
    if (medicamentosRecetados.length === 1) {
      alert(
        "Debe haber al menos un medicamento. Deshabilite la sección si no desea recetar medicamentos."
      );
      return;
    }
    const confirmar = confirm("¿Está seguro de eliminar este medicamento?");
    if (confirmar) {
      setMedicamentosRecetados(
        medicamentosRecetados.filter((_, i) => i !== index)
      );
    }
  };




  const guardarEnCache = () => {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (!cacheStr) return;

      const cache: CacheNotaMedica = JSON.parse(cacheStr);

      // Actualizar el plan en el cache
      cache.datos_plan = {
        opciones,
      };

      if (opciones.laboratorio) {
        cache.datos_plan.laboratorio = { estudios: estudiosLab };
      }

      // Solo guardar datos de medicamentos si la opción está habilitada
      if (opciones.medicamentos) {
        const datosMedicamentos: DatosMedicamentos = {
          medicamentos: medicamentosRecetados,
        };
        cache.datos_plan.medicamentos = datosMedicamentos;
      }

      if (opciones.incapacidad) {
        cache.datos_plan.incapacidad = {
          fecha_inicio: incapacidadData.fecha_inicio,
          fecha_fin: incapacidadData.fecha_fin,
          dias: incapacidadData.dias_totales, // Importante: Mapeamos a 'dias'
          motivo: incapacidadData.motivo,
          diagnostico_codigo: incapacidadData.diagnostico_codigo,
          diagnostico_titulo: incapacidadData.diagnostico_titulo,
        };
      }

      // Guardar datos de referencia a especialidad si está habilitada
      if (opciones.especialidad) {
        cache.datos_plan.referencia_especialidad = {
          id_especialidad_solicitada: parseInt(especialidadSeleccionada),
          motivo_referencia: motivoReferencia,
          nivel_triage: nivelTriage,
        };
      }

      cache.hoja_actual = 2;
      cache.timestamp = new Date().toISOString();

      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

      console.log("💾 [PlanTratamiento] Cache guardado:", cache);
    } catch (error) {
      console.error("Error al guardar cache:", error);
    }
  };

  const validarFormulario = (): boolean => {
    // Solo validar secciones habilitadas

    // Validar MEDICAMENTOS
    if (opciones.medicamentos) {
      for (let i = 0; i < medicamentosRecetados.length; i++) {
        const med = medicamentosRecetados[i];

        if (
          !med.clavemedicamento ||
          med.clavemedicamento === "" ||
          med.clavemedicamento === 0
        ) {
          alert(`Por favor seleccione un medicamento en la posición ${i + 1}`);
          return false;
        }

        if (!med.indicaciones.trim()) {
          alert(
            `Por favor ingrese las indicaciones para ${med.nombre_medicamento}`
          );
          return false;
        }

        if (med.piezas < 1) {
          alert(
            `Por favor ingrese una cantidad válida de piezas para ${med.nombre_medicamento}`
          );
          return false;
        }

        if (
          med.realizar_resurtimiento &&
          (!med.meses_resurtimiento || med.meses_resurtimiento < 2)
        ) {
          alert(
            `Por favor seleccione los meses de resurtimiento para ${med.nombre_medicamento}`
          );
          return false;
        }
      }
    }

    // Validar LABORATORIO
    if (opciones.laboratorio && estudiosLab.length === 0) {
      alert("Seleccionó Laboratorio pero no agregó ningún estudio.");
      return false;
    }

    // Validar INCAPACIDAD
    if (opciones.incapacidad) {
      if (!incapacidadData.fecha_inicio || !incapacidadData.fecha_fin) {
        alert("Por favor seleccione las fechas de inicio y fin de la incapacidad.");
        return false;
      }

      const inicio = new Date(incapacidadData.fecha_inicio);
      const fin = new Date(incapacidadData.fecha_fin);

      if (fin < inicio) {
        alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
        return false;
      }

      if (incapacidadData.dias_totales > 30) {
        alert(`La incapacidad no puede exceder los 30 días (Días actuales: ${incapacidadData.dias_totales}).`);
        return false;
      }

      if (incapacidadData.dias_totales < 1) {
        alert("La duración debe ser de al menos 1 día.");
        return false;
      }

      // Validar que se haya seleccionado un diagnóstico como motivo
      if (!incapacidadData.diagnostico_codigo) {
        alert("Por favor seleccione el diagnóstico (motivo) de la incapacidad.");
        return false;
      }
    }

    // Validar REFERENCIA A ESPECIALIDAD
    if (opciones.especialidad) {
      if (!especialidadSeleccionada || especialidadSeleccionada === "") {
        alert("Por favor seleccione una especialidad para la referencia");
        return false;
      }

      if (!motivoReferencia.trim()) {
        alert("Por favor ingrese el motivo de la referencia");
        return false;
      }

      if (motivoReferencia.trim().length < 10) {
        alert("El motivo de la referencia debe tener al menos 10 caracteres");
        return false;
      }

      if (!nivelTriage) {
        alert("Por favor seleccione el nivel de triage para la referencia");
        return false;
      }
    }

    return true;
  };

  const handleVolver = () => {
    const confirmar = confirm(
      "¿Está seguro de volver? Los datos ingresados se guardarán en caché."
    );
    if (confirmar) {
      guardarEnCache();
      router.push(`/dashboard/consultas/diagnostico/atender/${id}`);
    }
  };

  const handleFinalizar = async () => {
    if (!validarFormulario()) {
      return;
    }

    // Verificar si seleccionó al menos una opción
    const algunaSeleccionada = Object.values(opciones).some((v) => v);

    if (!algunaSeleccionada) {
      const confirmar = confirm(
        "No ha seleccionado ninguna opción del Plan de Tratamiento.\n\n" +
        "¿Desea finalizar la consulta solo con el SOAP (sin plan)?"
      );
      if (!confirmar) return;
    }

    // Guardar en cache antes de enviar
    guardarEnCache();

    // Obtener cache completo
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) {
      alert("Error: No se encontró información en caché.");
      return;
    }

    const cache = JSON.parse(cacheStr);

    try {
      // 🔄 MOSTRAR LOADER CON LOGO DE PANDORA
      setShowLoader(true);

      console.log("📤 [Finalizar] Enviando datos al servidor:", cache);

      // Enviar al endpoint de finalizar
      const response = await fetch("/api/consultas/finalizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cache),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ [Finalizar] Respuesta del servidor:", data);

        // Si hay receta, preparar datos para el modal
        if (data.data?.receta) {
          // Construir el objeto completo con todos los datos necesarios
          const recetaCompleta = {
            ...data.data.receta,
            id_consulta: data.data.id_consulta,
            paciente: data.data.paciente, // Agregar datos del paciente
          };
          setRecetaGenerada(recetaCompleta);
        }

        // Ocultar loader
        setShowLoader(false);

        // Mostrar modal con la receta generada
        if (data.data?.receta) {
          setShowModalReceta(true);
        } else {
          // Si no hay receta, verificar si viene de referencia para mostrar modal
          localStorage.removeItem(CACHE_KEY);
          if (idReferenciaOrigen) {
            setShowModalAccion(true);
          } else {
            alert(
              `✅ Consulta finalizada exitosamente!\n\n` +
              `Folio: ${data.data.folio}\n\n` +
              `Los datos de la consulta han sido guardados.`
            );
            router.push("/dashboard/consultas/diagnostico");
          }
        }
      } else {
        setShowLoader(false);
        alert(
          `❌ Error al finalizar consulta:\n\n${data.error}\n\n${data.details || ""
          }`
        );
      }
    } catch (error: any) {
      console.error("Error al finalizar consulta:", error);
      setShowLoader(false);
      alert(`❌ Error al finalizar consulta:\n\n${error.message}`);
    }
  };

  const handleCerrarModalReceta = () => {
    setShowModalReceta(false);
    localStorage.removeItem(CACHE_KEY);
    if (idReferenciaOrigen) {
      setShowModalAccion(true);
    } else {
      router.push("/dashboard/consultas/diagnostico");
    }
  };


  if (loading || !mounted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0d2137]" : "bg-gray-50"
          }`}
      >
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
              }`}
          ></div>
          <p
            className={`mt-4 font-medium ${isDark ? "text-gray-300" : "text-gray-600"
              }`}
          >
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  const secciones = [
    {
      id: "medicamentos" as keyof OpcionesPlan,
      titulo: "Medicamentos",
      descripcion: "Prescribir medicamentos al paciente",
      icon: Pill,
      iconColor: "text-blue-500",
      iconBg: isDark ? "bg-blue-500/15" : "bg-blue-50",
      // Tema azul
      barraColor: "from-blue-500 via-cyan-500 to-blue-500",
      borderColor: isDark ? "border-blue-500/40" : "border-blue-400/50",
      bgGradient: isDark ? "from-blue-500/5 to-transparent" : "from-blue-50 to-white",
      ringColor: "ring-blue-500/20",
      badgeBg: isDark ? "bg-blue-500/20" : "bg-blue-100",
      badgeText: isDark ? "text-blue-400" : "text-blue-700",
      toggleGradient: "from-blue-500 to-cyan-500",
      shadowColor: isDark ? "shadow-blue-500/30" : "shadow-blue-400/40",
    },
    {
      id: "incapacidad" as keyof OpcionesPlan,
      titulo: "Incapacidad",
      descripcion: "Asignar días de incapacidad médica",
      icon: FileText,
      iconColor: "text-red-500",
      iconBg: isDark ? "bg-red-500/15" : "bg-red-50",
      // Tema rojo
      barraColor: "from-red-500 via-rose-500 to-red-500",
      borderColor: isDark ? "border-red-500/40" : "border-red-400/50",
      bgGradient: isDark ? "from-red-500/5 to-transparent" : "from-red-50 to-white",
      ringColor: "ring-red-500/20",
      badgeBg: isDark ? "bg-red-500/20" : "bg-red-100",
      badgeText: isDark ? "text-red-400" : "text-red-700",
      toggleGradient: "from-red-500 to-rose-500",
      shadowColor: isDark ? "shadow-red-500/30" : "shadow-red-400/40",
    },
    {
      id: "especialidad" as keyof OpcionesPlan,
      titulo: "Especialidad",
      descripcion: "Referir a médico especialista",
      icon: UserPlus,
      iconColor: "text-purple-500",
      iconBg: isDark ? "bg-purple-500/15" : "bg-purple-50",
      // Tema morado
      barraColor: "from-purple-500 via-violet-500 to-purple-500",
      borderColor: isDark ? "border-purple-500/40" : "border-purple-400/50",
      bgGradient: isDark ? "from-purple-500/5 to-transparent" : "from-purple-50 to-white",
      ringColor: "ring-purple-500/20",
      badgeBg: isDark ? "bg-purple-500/20" : "bg-purple-100",
      badgeText: isDark ? "text-purple-400" : "text-purple-700",
      toggleGradient: "from-purple-500 to-violet-500",
      shadowColor: isDark ? "shadow-purple-500/30" : "shadow-purple-400/40",
    },
    {
      id: "laboratorio" as keyof OpcionesPlan,
      titulo: "Estudios de Laboratorio",
      descripcion: "Solicitar análisis clínicos",
      icon: FlaskConical,
      iconColor: "text-green-500",
      iconBg: isDark ? "bg-green-500/15" : "bg-green-50",
      // Tema verde
      barraColor: "from-green-500 via-emerald-500 to-green-500",
      borderColor: isDark ? "border-green-500/40" : "border-green-400/50",
      bgGradient: isDark ? "from-green-500/5 to-transparent" : "from-green-50 to-white",
      ringColor: "ring-green-500/20",
      badgeBg: isDark ? "bg-green-500/20" : "bg-green-100",
      badgeText: isDark ? "text-green-400" : "text-green-700",
      toggleGradient: "from-green-500 to-emerald-500",
      shadowColor: isDark ? "shadow-green-500/30" : "shadow-green-400/40",
    },
  ];

  return (
    <div className="space-y-6 pb-40">
      {/* Header Mejorado con Animación */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#0a1929] via-[#0a1929] to-[#0d2137]' : 'bg-white'}`}
      >
        <div className={`h-2 bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2]`}></div>
        <div className="p-6">
          <button
            onClick={handleVolver}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-all duration-300 ${isDark
              ? 'text-gray-300 hover:text-white hover:bg-[#0f83b2]/10 hover:border-[#0f83b2]/30 border border-transparent'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 border border-transparent'
              }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver a SOAP</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl shadow-xl ${isDark
                ? 'bg-gradient-to-br from-[#0f83b2] to-[#0a6d8f] shadow-[#0db1ec]/30'
                : 'bg-gradient-to-br from-[#0f83b2] to-[#0db1ec] shadow-[#0f83b2]/40'
                }`}>
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Plan de Tratamiento
                </h1>
                <p className={`mt-1 text-sm md:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Opciones del Plan (P) - Metodología SOAP
                </p>
              </div>
            </div>

            {/* Indicador de progreso mejorado */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`px-6 py-3 rounded-xl border-2 self-start md:self-auto ${isDark
                ? 'bg-gradient-to-br from-[#0f83b2]/10 to-[#0db1ec]/5 border-[#0db1ec]/40'
                : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                }`}
            >
              <div className="flex items-center gap-2">
                <div className={`text-sm font-semibold ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`}>
                  Hoja 2 de 2
                </div>
                <CheckCircle className={`w-4 h-4 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`} />
              </div>
              <div className="flex gap-2 mt-2">
                <div className={`h-2 w-12 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                <div className={`h-2 w-12 rounded-full bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] shadow-md ${isDark ? 'shadow-[#0db1ec]/30' : 'shadow-[#0f83b2]/40'
                  }`}></div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Instrucciones Mejoradas con Animación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-xl shadow-lg overflow-hidden ${isDark ? 'bg-[#0a1929]' : 'bg-white'}`}
      >
        <div className={`h-1 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec]`}></div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shadow-md ${isDark
              ? 'bg-gradient-to-br from-[#0db1ec]/20 to-[#0f83b2]/10 shadow-[#0db1ec]/20'
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 shadow-blue-200/50'
              }`}>
              <CheckCircle className={`w-6 h-6 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Instrucciones
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Active las secciones que necesite utilizando el interruptor. Todas están deshabilitadas por defecto.
                Configure cada sección habilitada y presione <span className="font-semibold">"Finalizar Consulta"</span> al terminar.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Secciones Mejoradas con Animación */}
      {secciones.map((seccion, index) => {
        const Icon = seccion.icon;
        const habilitada = opciones[seccion.id];
        const expandida = seccionesExpandidas[seccion.id];

        return (
          <motion.div
            key={seccion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${habilitada
              ? `border-2 ${seccion.borderColor} ${isDark ? "bg-gradient-to-br from-[#0a1929] to-[#0d2137]" : "bg-white"} ring-2 ${seccion.ringColor} ${seccion.shadowColor}`
              : isDark
                ? "border border-[#0f83b2]/20 bg-[#0a1929]"
                : "border border-gray-200 bg-white"
              }`}
          >
            {/* Barra superior de color cuando está habilitada */}
            {habilitada && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5 }}
                className={`h-1.5 bg-gradient-to-r ${seccion.barraColor}`}
              />
            )}

            {/* Header de la sección */}
            <div className={`p-6 ${habilitada ? `bg-gradient-to-br ${seccion.bgGradient}` : ''}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`p-3 rounded-xl shadow-md ${seccion.iconBg}`}
                  >
                    <Icon className={`w-6 h-6 ${seccion.iconColor}`} />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                      {seccion.titulo}
                      {habilitada && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`px-2 py-0.5 text-xs font-bold rounded-full ${seccion.badgeBg} ${seccion.badgeText}`}
                        >
                          Activo
                        </motion.span>
                      )}
                    </h3>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {seccion.descripcion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Toggle para habilitar/deshabilitar mejorado */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSeccion(seccion.id)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 shadow-lg ${habilitada
                      ? `bg-gradient-to-r ${seccion.toggleGradient} ${seccion.shadowColor}`
                      : isDark ? "bg-gray-700 shadow-gray-900/50" : "bg-gray-300 shadow-gray-400/50"
                      }`}
                  >
                    <motion.span
                      animate={{ x: habilitada ? 36 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`inline-block h-6 w-6 rounded-full bg-white shadow-md`}
                    />
                  </motion.button>

                  {/* Botón de expansión/colapso */}
                  {habilitada && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => toggleExpansion(seccion.id)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-[#0f83b2]/20" : "hover:bg-gray-200"
                        }`}
                    >
                      <motion.div
                        animate={{ rotate: expandida ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className={`w-5 h-5 ${seccion.iconColor}`} />
                      </motion.div>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido de la sección */}
            {habilitada && expandida && (
              <div className="p-6 border-t">
                {seccion.id === "medicamentos" && (
                  <div className="space-y-4">
                    {loadingMedicamentos ? (
                      <div className="text-center py-8">
                        <div
                          className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDark ? "border-[#0db1ec]" : "border-[#0f83b2]"
                            }`}
                        ></div>
                        <p
                          className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                        >
                          Cargando medicamentos...
                        </p>
                      </div>
                    ) : (
                      <>
                        {medicamentosRecetados.map((med, index) => (
                          <FormularioMedicamento
                            key={med.id_temp}
                            medicamento={med}
                            medicamentos={medicamentos}
                            onChange={(medicamento) =>
                              actualizarMedicamento(index, medicamento)
                            }
                            onRemove={() => eliminarMedicamento(index)}
                            canRemove={medicamentosRecetados.length > 1}
                            isDark={isDark}
                          />
                        ))}

                        {/* Botón Agregar Medicamento */}
                        <button
                          onClick={agregarMedicamento}
                          className={`w-full py-4 border-2 border-dashed rounded-xl transition-colors ${isDark
                            ? "border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10 text-blue-400"
                            : "border-blue-300 hover:border-blue-600 hover:bg-blue-50 text-blue-600"
                            }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Pill className="w-5 h-5" />
                            <span className="font-medium">
                              Agregar Otro Medicamento
                            </span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {seccion.id === "incapacidad" && (
                  <div className="space-y-6">
                    <div className={`p-5 rounded-xl border ${isDark ? "bg-[#0d2137]/50 border-[#0f83b2]/30" : "bg-red-50 border-red-100"}`}>

                      {/* Encabezado interno */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-lg ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"}`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={`font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                            Solicitud de Incapacidad
                          </h4>
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Esta solicitud se enviará a la bandeja de "Pendientes de Autorización Laboral".
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Fecha Inicio */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Fecha de Inicio
                          </label>
                          <input
                            type="date"
                            value={incapacidadData.fecha_inicio}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setIncapacidadData({ ...incapacidadData, fecha_inicio: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]"
                              : "bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]"
                              }`}
                          />
                        </div>

                        {/* Fecha Fin */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Fecha de Fin
                          </label>
                          <input
                            type="date"
                            value={incapacidadData.fecha_fin}
                            min={incapacidadData.fecha_inicio}
                            onChange={(e) => setIncapacidadData({ ...incapacidadData, fecha_fin: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]"
                              : "bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]"
                              }`}
                          />
                        </div>

                        {/* Contador de Días */}
                        <div>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Días Totales
                          </label>
                          <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${incapacidadData.dias_totales > 30
                            ? "border-red-500 bg-red-500/10"
                            : isDark ? "bg-[#0a1929] border-[#0f83b2]/30" : "bg-gray-100 border-gray-300"
                            }`}>
                            <span className={`font-bold text-lg ${incapacidadData.dias_totales > 30
                              ? "text-red-500"
                              : isDark ? "text-white" : "text-gray-900"
                              }`}>
                              {incapacidadData.dias_totales} días
                            </span>
                            {incapacidadData.dias_totales > 30 && (
                              <span className="text-xs text-red-500 font-bold">Excede límite (30)</span>
                            )}
                          </div>
                        </div>

                        {/* Selector de Diagnóstico (Motivo de Incapacidad) */}
                        <div className="md:col-span-3">
                          <label className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Motivo de Incapacidad (Diagnóstico CIE-11) *
                          </label>
                          {diagnosticosDisponibles.length > 0 ? (
                            <select
                              value={incapacidadData.diagnostico_codigo}
                              onChange={(e) => {
                                const selected = diagnosticosDisponibles.find(d => d.codigo === e.target.value);
                                setIncapacidadData({
                                  ...incapacidadData,
                                  diagnostico_codigo: e.target.value,
                                  diagnostico_titulo: selected?.titulo || ""
                                });
                              }}
                              className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                                ? "bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-red-500"
                                : "bg-white border-gray-300 text-gray-900 focus:border-red-500"
                                } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
                            >
                              <option value="">Seleccione el diagnóstico que causa la incapacidad...</option>
                              {diagnosticosDisponibles.map((diag, idx) => (
                                <option key={idx} value={diag.codigo}>
                                  {diag.es_principal ? "[Principal] " : ""}{diag.codigo} - {diag.titulo}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? "border-yellow-500/30 bg-yellow-500/10" : "border-yellow-400 bg-yellow-50"
                              }`}>
                              <p className={`text-sm ${isDark ? "text-yellow-400" : "text-yellow-700"}`}>
                                No hay diagnósticos registrados en esta consulta.
                                Vuelva a la Hoja 1 (SOAP) y agregue al menos un diagnóstico CIE-11.
                              </p>
                            </div>
                          )}
                          {incapacidadData.diagnostico_codigo && (
                            <p className={`mt-2 text-xs ${isDark ? "text-red-400" : "text-red-600"}`}>
                              Diagnóstico seleccionado: <span className="font-bold">{incapacidadData.diagnostico_codigo}</span> - {incapacidadData.diagnostico_titulo}
                            </p>
                          )}
                        </div>

                        {/* Observaciones adicionales */}
                        <div className="md:col-span-3">
                          <label className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Observaciones adicionales para Administración (Opcional)
                          </label>
                          <input
                            type="text"
                            value={incapacidadData.motivo}
                            onChange={(e) => setIncapacidadData({ ...incapacidadData, motivo: e.target.value })}
                            placeholder="Ej. Requiere reposo absoluto, no puede cargar peso..."
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]"
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {seccion.id === "especialidad" && (
                  <div className="space-y-6">
                    {/* Formulario de Referencia a Especialidad */}
                    <div
                      className={`p-5 rounded-xl border ${isDark
                        ? "bg-[#0d2137]/50 border-[#0f83b2]/30"
                        : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <h4
                        className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                      >
                        <UserPlus className="w-4 h-4 text-purple-500" />
                        Referir a Especialista
                      </h4>

                      <div className="space-y-4">
                        {/* Dropdown de Especialidades */}
                        <div>
                          <label
                            className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                          >
                            Especialidad Solicitada *
                          </label>
                          <select
                            value={especialidadSeleccionada}
                            onChange={(e) =>
                              setEspecialidadSeleccionada(e.target.value)
                            }
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-purple-500"
                              : "bg-white border-gray-300 text-gray-900 focus:border-purple-500"
                              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                          >
                            <option value="">Seleccione una especialidad...</option>
                            {catalogoEspecialidades.map((item) => (
                              <option
                                key={item.claveespecialidad}
                                value={item.claveespecialidad}
                              >
                                {item.especialidad}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Textarea de Motivo de Referencia */}
                        <div>
                          <label
                            className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                          >
                            Motivo de la Referencia *
                          </label>
                          <textarea
                            value={motivoReferencia}
                            onChange={(e) => setMotivoReferencia(e.target.value)}
                            placeholder="Describa el motivo clínico por el cual refiere al paciente al especialista (mínimo 10 caracteres)..."
                            rows={4}
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors resize-none ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-purple-500"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500"
                              } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                          />
                          <p
                            className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                          >
                            {motivoReferencia.length} caracteres (mínimo 10)
                          </p>
                        </div>

                        {/* Nivel de Triage */}
                        <div>
                          <label
                            className={`block text-xs font-medium mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Nivel de Triage *
                            <span className={`ml-2 text-[11px] font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                              (según NOM-027-SSA3 / Sistema Manchester adaptado)
                            </span>
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                            {[
                              {
                                nivel: 1,
                                nombre: "Emergencia",
                                tiempo: "< 24 horas",
                                bg: isDark ? "bg-red-900/40 border-red-500/60 hover:bg-red-900/60" : "bg-red-50 border-red-400 hover:bg-red-100",
                                bgSelected: isDark ? "bg-red-700/60 border-red-400 ring-2 ring-red-400/50" : "bg-red-100 border-red-500 ring-2 ring-red-400/40",
                                dot: "bg-red-500",
                                textNombre: isDark ? "text-red-300" : "text-red-700",
                                textTiempo: isDark ? "text-red-400/80" : "text-red-600/80",
                              },
                              {
                                nivel: 2,
                                nombre: "Urgente",
                                tiempo: "24 – 72 horas",
                                bg: isDark ? "bg-orange-900/40 border-orange-500/60 hover:bg-orange-900/60" : "bg-orange-50 border-orange-400 hover:bg-orange-100",
                                bgSelected: isDark ? "bg-orange-700/60 border-orange-400 ring-2 ring-orange-400/50" : "bg-orange-100 border-orange-500 ring-2 ring-orange-400/40",
                                dot: "bg-orange-500",
                                textNombre: isDark ? "text-orange-300" : "text-orange-700",
                                textTiempo: isDark ? "text-orange-400/80" : "text-orange-600/80",
                              },
                              {
                                nivel: 3,
                                nombre: "Semi-urgente",
                                tiempo: "1 – 2 semanas",
                                bg: isDark ? "bg-yellow-900/40 border-yellow-500/60 hover:bg-yellow-900/60" : "bg-yellow-50 border-yellow-400 hover:bg-yellow-100",
                                bgSelected: isDark ? "bg-yellow-700/60 border-yellow-400 ring-2 ring-yellow-400/50" : "bg-yellow-100 border-yellow-500 ring-2 ring-yellow-400/40",
                                dot: "bg-yellow-500",
                                textNombre: isDark ? "text-yellow-300" : "text-yellow-700",
                                textTiempo: isDark ? "text-yellow-400/80" : "text-yellow-600/80",
                              },
                              {
                                nivel: 4,
                                nombre: "Programable",
                                tiempo: "2 – 4 semanas",
                                bg: isDark ? "bg-green-900/40 border-green-500/60 hover:bg-green-900/60" : "bg-green-50 border-green-400 hover:bg-green-100",
                                bgSelected: isDark ? "bg-green-700/60 border-green-400 ring-2 ring-green-400/50" : "bg-green-100 border-green-500 ring-2 ring-green-400/40",
                                dot: "bg-green-500",
                                textNombre: isDark ? "text-green-300" : "text-green-700",
                                textTiempo: isDark ? "text-green-400/80" : "text-green-600/80",
                              },
                              {
                                nivel: 5,
                                nombre: "Electiva",
                                tiempo: "1 – 3 meses",
                                bg: isDark ? "bg-blue-900/40 border-blue-500/60 hover:bg-blue-900/60" : "bg-blue-50 border-blue-400 hover:bg-blue-100",
                                bgSelected: isDark ? "bg-blue-700/60 border-blue-400 ring-2 ring-blue-400/50" : "bg-blue-100 border-blue-500 ring-2 ring-blue-400/40",
                                dot: "bg-blue-500",
                                textNombre: isDark ? "text-blue-300" : "text-blue-700",
                                textTiempo: isDark ? "text-blue-400/80" : "text-blue-600/80",
                              },
                            ].map((t) => (
                              <button
                                key={t.nivel}
                                type="button"
                                onClick={() => setNivelTriage(t.nivel)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${nivelTriage === t.nivel ? t.bgSelected : t.bg}`}
                              >
                                <span className={`w-3 h-3 rounded-full ${t.dot}`} />
                                <span className={`text-xs font-bold leading-tight text-center ${t.textNombre}`}>
                                  {t.nombre}
                                </span>
                                <span className={`text-[10px] font-medium text-center ${t.textTiempo}`}>
                                  {t.tiempo}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {seccion.id === "laboratorio" && (
                  <div className="space-y-6">
                    {/* 1. ÁREA DE CAPTURA */}
                    <div
                      className={`p-5 rounded-xl border ${isDark
                        ? "bg-[#0d2137]/50 border-[#0f83b2]/30"
                        : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <h4
                        className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-gray-200" : "text-gray-700"
                          }`}
                      >
                        <FlaskConical className="w-4 h-4 text-[#0db1ec]" />
                        Solicitar Estudio
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Dropdown del Catálogo */}
                        <div className="md:col-span-5">
                          <label
                            className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                          >
                            Estudio
                          </label>
                          <select
                            value={labSeleccionadoId}
                            onChange={(e) =>
                              setLabSeleccionadoId(e.target.value)
                            }
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]"
                              : "bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]"
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                          >
                            <option value="">Seleccione del catálogo...</option>
                            {catalogoLab.map((item) => (
                              <option
                                key={item.id_estudio}
                                value={item.id_estudio}
                              >
                                {item.nombre_estudio}{" "}
                                {item.categoria ? `(${item.categoria})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Input de Motivo (Aparece al seleccionar o siempre visible) */}
                        <div className="md:col-span-5">
                          <label
                            className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                          >
                            Motivo Clínico
                          </label>
                          <input
                            type="text"
                            value={labMotivo}
                            onChange={(e) => setLabMotivo(e.target.value)}
                            placeholder="Ej. Control de rutina, Sospecha de infección..."
                            className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${isDark
                              ? "bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]"
                              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]"
                              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
                          />
                        </div>

                        {/* Botón Agregar */}
                        <div className="md:col-span-2">
                          <button
                            onClick={agregarEstudioLab}
                            disabled={!labSeleccionadoId || !labMotivo}
                            className="w-full py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#0db1ec]/20"
                          >
                            <Plus className="w-5 h-5" />
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. LISTA DE ESTUDIOS AGREGADOS (ORDEN) */}
                    <div className="space-y-3">
                      <h4
                        className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                      >
                        Orden de Estudios ({estudiosLab.length})
                      </h4>

                      {estudiosLab.length === 0 ? (
                        <div
                          className={`text-center py-6 border-2 border-dashed rounded-xl ${isDark
                            ? "border-gray-700 text-gray-500"
                            : "border-gray-300 text-gray-400"
                            }`}
                        >
                          <p className="text-sm">
                            No hay estudios agregados a la orden.
                          </p>
                        </div>
                      ) : (
                        estudiosLab.map((item, index) => (
                          <div
                            key={item.id_temp}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isDark
                              ? "bg-[#0a1929] border-[#0f83b2]/20"
                              : "bg-white border-gray-200 shadow-sm"
                              }`}
                          >
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${isDark
                                ? "bg-[#0f83b2]/20 text-[#0db1ec]"
                                : "bg-blue-50 text-blue-600"
                                }`}
                            >
                              {index + 1}
                            </div>

                            <div className="flex-1">
                              <p
                                className={`font-bold ${isDark ? "text-white" : "text-gray-800"
                                  }`}
                              >
                                {item.nombre_estudio}
                              </p>
                              <p
                                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"
                                  }`}
                              >
                                <span className="font-medium">Motivo:</span>{" "}
                                {item.motivo}
                              </p>
                            </div>

                            <button
                              onClick={() => eliminarEstudioLab(item.id_temp)}
                              className={`p-2 rounded-lg transition-colors ${isDark
                                ? "text-red-400 hover:bg-red-500/10"
                                : "text-red-500 hover:bg-red-50"
                                }`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje cuando está deshabilitada */}
            {!habilitada && (
              <div className="p-6 border-t">
                <p
                  className={`text-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  Sección deshabilitada. Active el toggle para habilitar.
                </p>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Footer Mejorado - Botón Finalizar Consulta */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className={`fixed bottom-0 left-0 lg:left-64 right-0 ${isDark
          ? "bg-[#0a1929] border-t-2 border-[#0f83b2]/20"
          : "bg-white border-t-2 border-gray-200"
          } shadow-2xl z-40`}
      >
        {/* Barra de gradiente superior */}
        <div className="h-1 bg-gradient-to-r from-[#0f83b2] via-[#0db1ec] to-[#0f83b2]" />

        <div className="px-6 py-5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
            {/* Info izquierda */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0db1ec]/20' : 'bg-blue-50'}`}>
                <CheckCircle className={`w-5 h-5 ${isDark ? 'text-[#0db1ec]' : 'text-[#0f83b2]'}`} />
              </div>
              <div className="hidden md:block">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Listo para finalizar
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Revise los datos antes de continuar
                </p>
              </div>
            </div>

            {/* Botón principal */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinalizar}
              className={`relative flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-base shadow-xl transition-all duration-300 overflow-hidden ${isDark
                ? "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] shadow-[#0db1ec]/40 hover:shadow-[#0db1ec]/60"
                : "bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] shadow-[#0f83b2]/40 hover:shadow-[#0f83b2]/60"
                } text-white`}
            >
              {/* Efecto de brillo */}
              <motion.div
                animate={{
                  x: [-200, 200],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "linear",
                }}
                className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />

              <CheckCircle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Finalizar Consulta</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 🔄 LOADER - GENERANDO RECETA CON LOGO DE PANDORA */}
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl ${isDark ? "bg-[#050b14]/40" : "bg-white/40"
              }`}
          >
            <div className="flex flex-col items-center">
              {/* Logo con respiración sutil y Toque Neon */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.8, 1, 0.8],
                  filter: [
                    "drop-shadow(0 0 8px rgba(13, 177, 236, 0.3))",
                    "drop-shadow(0 0 15px rgba(13, 177, 236, 0.6))",
                    "drop-shadow(0 0 8px rgba(13, 177, 236, 0.3))"
                  ]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-40 h-40 mb-6"
              >
                <Image
                  src="/logo_pandora.png"
                  alt="Pandora Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>

              {/* Texto con fuente del sistema y toque cian */}
              <div className="text-center">
                <h3
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"
                    }`}
                >
                  GENERANDO RECETA
                </h3>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-1 bg-gradient-to-r from-transparent via-[#0db1ec] to-transparent mt-2 mx-auto max-w-[120px] rounded-full opacity-70"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📋 MODAL - RECETA GENERADA */}
      {showModalReceta && recetaGenerada && (
        <ModalReceta
          isOpen={showModalReceta}
          onClose={handleCerrarModalReceta}
          recetaData={recetaGenerada}
          isDark={isDark}
        />
      )}

      {/* 🔄 MODAL - ACCIÓN POST-CONSULTA (solo si viene de una referencia) */}
      {showModalAccion && idReferenciaOrigen && (
        <ModalAccionPostConsulta
          isOpen={showModalAccion}
          onClose={() => {
            setShowModalAccion(false);
            router.push("/dashboard/consultas/diagnostico");
          }}
          idReferenciaOrigen={idReferenciaOrigen}
          idConsultaEspecialista={parseInt(id)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
