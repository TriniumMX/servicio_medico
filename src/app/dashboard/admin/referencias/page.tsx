"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { 
  UserPlus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban,
  Calendar,
  MapPin,
  Stethoscope,
  Printer
} from "lucide-react";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

interface Referencia {
  id_referencia: number;
  folio_consulta: string;
  nombre_paciente: string;
  no_nomina: string;
  departamento: string;
  nombre_medico_refiere: string;
  nombre_especialidad: string;
  motivo_referencia: string;
  fecha_solicitud: string;
  // Datos Admin
  lugar_atencion?: string;
  medico_asignado?: string;
  fecha_cita?: string;
  motivo_rechazo?: string;
}

export default function GestionReferenciasPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Referencia[]>([]);
  const [filtro, setFiltro] = useState("");
  
  // Pestañas
  const [tabActual, setTabActual] = useState<"pendiente_autorizar" | "autorizada" | "rechazada">("pendiente_autorizar");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) cargarDatos();
  }, [mounted, tabActual]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referencias?estatus=${tabActual}`);
      const respuesta = await res.json();
      if (respuesta.success) setData(respuesta.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- ACCIONES ---
  const rechazarReferencia = async (id: number) => {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Solicitud',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Escriba la razón clínica o administrativa...',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Rechazar'
    });

    if (motivo) {
      enviarDecision(id, 'RECHAZAR', { motivo });
    }
  };

  const autorizarReferencia = async (item: Referencia) => {
    const { value: formValues } = await Swal.fire({
      title: 'Asignar Cita con Especialista',
      html:
        `<div class="text-left space-y-3">
           <div>
             <label class="block text-sm font-bold mb-1">Lugar / Hospital</label>
             <input id="swal-lugar" class="swal2-input m-0 w-full" placeholder="Ej. Hospital Ángeles">
           </div>
           <div>
             <label class="block text-sm font-bold mb-1">Médico Especialista</label>
             <input id="swal-medico" class="swal2-input m-0 w-full" placeholder="Ej. Dr. Gregory House">
           </div>
           <div>
             <label class="block text-sm font-bold mb-1">Fecha y Hora de Cita</label>
             <input id="swal-fecha" type="datetime-local" class="swal2-input m-0 w-full">
           </div>
           <div>
             <label class="block text-sm font-bold mb-1">Notas (Opcional)</label>
             <textarea id="swal-notas" class="swal2-textarea m-0 w-full" placeholder="Traer estudios previos..."></textarea>
           </div>
         </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Autorizar y Generar Pase',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        return {
          lugar: (document.getElementById('swal-lugar') as HTMLInputElement).value,
          medico: (document.getElementById('swal-medico') as HTMLInputElement).value,
          fecha_cita: (document.getElementById('swal-fecha') as HTMLInputElement).value,
          notas: (document.getElementById('swal-notas') as HTMLTextAreaElement).value
        }
      }
    });

    if (formValues) {
      if (!formValues.lugar || !formValues.medico || !formValues.fecha_cita) {
        Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
        return;
      }
      enviarDecision(item.id_referencia, 'AUTORIZAR', formValues);
    }
  };

  const enviarDecision = async (id: number, accion: string, datos: any) => {
    try {
      const res = await fetch('/api/admin/referencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_referencia: id, accion, datos })
      });
      
      if ((await res.json()).success) {
        Swal.fire('Listo', `Referencia ${accion === 'AUTORIZAR' ? 'autorizada' : 'rechazada'} correctamente`, 'success');
        cargarDatos();
      } else {
        Swal.fire('Error', 'No se pudo procesar la solicitud', 'error');
      }
    } catch (e) { Swal.fire('Error', 'Error de conexión', 'error'); }
  };

  // --- GENERAR PDF DEL PASE ---
  const imprimirPase = (item: Referencia) => {
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFillColor(142, 68, 173); // Morado
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("REFERENCIA A ESPECIALIDAD", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Coordinación Médica", 105, 28, { align: 'center' });

    // Datos Generales
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Folio Referencia: REF-${item.id_referencia}`, 150, 50);

    // Cuadro Paciente
    doc.setDrawColor(200);
    doc.rect(14, 55, 182, 35);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL PACIENTE", 18, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${item.nombre_paciente}`, 18, 70);
    doc.text(`Nómina: ${item.no_nomina}`, 120, 70);
    doc.text(`Departamento: ${item.departamento}`, 18, 78);
    doc.text(`Médico que refiere: Dr. ${item.nombre_medico_refiere}`, 18, 86);

    // Cuadro Cita
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 95, 182, 50, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DE LA CITA AUTORIZADA", 18, 102);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Especialidad: ${item.nombre_especialidad}`, 18, 112);
    doc.text(`Médico Asignado: ${item.medico_asignado}`, 18, 120);
    doc.text(`Lugar: ${item.lugar_atencion}`, 18, 128);
    
    const fecha = item.fecha_cita ? new Date(item.fecha_cita) : new Date();
    doc.setFont("helvetica", "bold");
    doc.setTextColor(142, 68, 173);
    doc.text(`FECHA Y HORA: ${fecha.toLocaleDateString()} - ${fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 18, 138);

    // Motivo
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("MOTIVO DE REFERENCIA:", 14, 155);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitMotivo = doc.splitTextToSize(item.motivo_referencia, 180);
    doc.text(splitMotivo, 14, 162);

    // Pie
    doc.line(70, 250, 140, 250);
    doc.setFontSize(8);
    doc.text("Firma de Coordinación Médica", 105, 255, { align: 'center' });

    doc.save(`Referencia_Especialidad_${item.no_nomina}.pdf`);
  };

  const dataFiltrada = data.filter(item => 
    item.nombre_paciente.toLowerCase().includes(filtro.toLowerCase()) ||
    item.no_nomina.includes(filtro)
  );

  const isDark = mounted && theme === "dark";
  if (!mounted) return null;

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
      
      <div className="mb-6">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
          Gestión de Referencias a Especialidad
        </h1>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Asignación de citas y autorización de referencias externas.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setTabActual("pendiente_autorizar")}
          className={`pb-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${
            tabActual === "pendiente_autorizar" ? "border-b-2 border-yellow-500 text-yellow-500" : "text-gray-500"
          }`}
        >
          <Clock className="w-4 h-4" /> Pendientes de Autorizar
        </button>
        <button
          onClick={() => setTabActual("autorizada")}
          className={`pb-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${
            tabActual === "autorizada" ? "border-b-2 border-purple-500 text-purple-500" : "text-gray-500"
          }`}
        >
          <CheckCircle className="w-4 h-4" /> Autorizadas (Cita Asignada)
        </button>
        <button
          onClick={() => setTabActual("rechazada")}
          className={`pb-3 px-4 font-medium flex items-center gap-2 whitespace-nowrap ${
            tabActual === "rechazada" ? "border-b-2 border-red-500 text-red-500" : "text-gray-500"
          }`}
        >
          <Ban className="w-4 h-4" /> Rechazadas
        </button>
      </div>

      {/* Buscador */}
      <div className={`p-4 rounded-xl shadow-sm mb-6 ${isDark ? "bg-[#0a1929]" : "bg-white"}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por paciente o nómina..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg outline-none ${
              isDark ? "bg-[#0d2137] text-white" : "bg-gray-50 text-gray-900"
            }`}
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : dataFiltrada.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isDark ? "border-gray-700" : "border-gray-300"}`}>
          <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No hay referencias en esta bandeja.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {dataFiltrada.map((item) => (
            <div 
              key={item.id_referencia}
              className={`p-6 rounded-xl border shadow-lg ${isDark ? "bg-[#0a1929] border-gray-800" : "bg-white border-gray-200"}`}
            >
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                
                {/* Info Principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      tabActual === "pendiente_autorizar" ? "bg-yellow-100 text-yellow-800" :
                      tabActual === "autorizada" ? "bg-purple-100 text-purple-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {tabActual === "pendiente_autorizar" ? "PENDIENTE" : tabActual.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Solicitado: {new Date(item.fecha_solicitud).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                    {item.nombre_paciente}
                  </h3>
                  <div className="flex items-center gap-2 text-purple-500 font-medium mb-2">
                    <Stethoscope className="w-4 h-4" />
                    {item.nombre_especialidad}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>Nómina: {item.no_nomina}</span>
                    <span>Depto: {item.departamento}</span>
                  </div>

                  <div className={`p-3 rounded-lg ${isDark ? "bg-[#0d2137]" : "bg-gray-50"}`}>
                    <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <span className="font-bold">Motivo:</span> {item.motivo_referencia}
                    </p>
                    
                    {/* Datos de Cita (Si está autorizada) */}
                    {tabActual === "autorizada" && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-bold text-purple-600 mb-1">✅ Cita Asignada:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{item.fecha_cita ? new Date(item.fecha_cita).toLocaleString() : 'S/F'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-gray-400" />
                            <span>{item.medico_asignado}</span>
                          </div>
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{item.lugar_atencion}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Motivo Rechazo */}
                    {tabActual === "rechazada" && (
                      <p className="text-sm text-red-500 mt-2 font-bold border-t pt-2 border-red-200">
                        🚫 Rechazo: {item.motivo_rechazo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex flex-col justify-center gap-3 md:w-56">
                  {tabActual === "pendiente_autorizar" && (
                    <>
                      <button 
                        onClick={() => autorizarReferencia(item)}
                        className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                      >
                        <CheckCircle className="w-4 h-4" /> Asignar Cita
                      </button>
                      <button 
                        onClick={() => rechazarReferencia(item.id_referencia)}
                        className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Rechazar
                      </button>
                    </>
                  )}

                  {tabActual === "autorizada" && (
                    <button 
                      onClick={() => imprimirPase(item)}
                      className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      <Printer className="w-4 h-4" /> Imprimir Pase
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}