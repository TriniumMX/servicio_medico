// src/components/catalogos/beneficiarios/CapturaFoto.tsx

'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

interface CapturaFotoProps {
  onFotoCapturada: (file: File) => void;
  fotoActual: File | null;
  isDark: boolean;
}

export default function CapturaFoto({ onFotoCapturada, fotoActual, isDark }: CapturaFotoProps) {
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [usarCamara, setUsarCamara] = useState(false);
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (fotoActual) {
      setFotoPreview(URL.createObjectURL(fotoActual));
    }
    return () => {
      detenerCamara();
    };
  }, []);

  const iniciarCamara = async () => {
    setCargandoCamara(true);
    try {
      // Intentar primero con cámara frontal
      let constraints: MediaStreamConstraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      };

      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Si falla con facingMode, intentar sin especificar
        console.log('Intentando sin facingMode...');
        constraints = {
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCargandoCamara(false);
          setUsarCamara(true);
        };
      }
      
      streamRef.current = stream;
      
    } catch (error: any) {
      setCargandoCamara(false);
      console.error('Error al acceder a la cámara:', error);
      
      let mensaje = 'No se pudo acceder a la cámara.';
      
      if (error.name === 'NotAllowedError') {
        mensaje = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.';
      } else if (error.name === 'NotFoundError') {
        mensaje = 'No se encontró ninguna cámara en el dispositivo.';
      } else if (error.name === 'NotReadableError') {
        mensaje = 'La cámara está siendo usada por otra aplicación. Cierra otras apps que usen la cámara e intenta de nuevo.';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error con la cámara',
        text: mensaje,
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setUsarCamara(false);
    setCargandoCamara(false);
  };

  const capturarFoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Dibujar el frame actual del video
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Convertir a blob y crear archivo
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
            onFotoCapturada(file);
            setFotoPreview(URL.createObjectURL(blob));
            detenerCamara();
          }
        }, 'image/jpeg', 0.95);
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Espera un momento',
        text: 'La cámara aún está cargando. Intenta de nuevo en unos segundos.',
        confirmButtonColor: '#0f83b2',
        background: isDark ? '#0a1929' : '#ffffff',
        color: isDark ? '#ffffff' : '#000000',
      });
    }
  };

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFotoCapturada(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const eliminarFoto = () => {
    onFotoCapturada(null as any);
    setFotoPreview(null);
    detenerCamara();
  };

  return (
    <div className="space-y-4">


      {/* Vista Previa de Foto */}
      {fotoPreview && !usarCamara ? (
        <div className="space-y-3">
          <div className="relative w-64 h-64 mx-auto">
            <img
              src={fotoPreview}
              alt="Vista previa"
              className="w-full h-full object-cover rounded-xl border-4 border-[#0db1ec] shadow-lg"
            />
            <button
              onClick={eliminarFoto}
              type="button"
              className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:scale-110"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-center text-sm text-green-500 font-semibold">✓ Foto capturada correctamente</p>
        </div>
      ) : usarCamara || cargandoCamara ? (
        /* Vista de Cámara Activa */
        <div className="space-y-4">
          <div className="relative w-full max-w-2xl mx-auto bg-black rounded-xl overflow-hidden">
            {cargandoCamara && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-[#0db1ec] animate-spin mx-auto mb-3" />
                  <p className="text-white">Iniciando cámara...</p>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto rounded-xl border-4 border-[#0db1ec]"
              style={{ minHeight: '400px', maxHeight: '600px' }}
            />
            
            {usarCamara && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                isDark ? 'bg-red-500/80' : 'bg-red-500'
              } text-white`}>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                EN VIVO
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={capturarFoto}
              type="button"
              disabled={cargandoCamara}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              Capturar Foto
            </button>
            <button
              onClick={detenerCamara}
              type="button"
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        /* Opciones Iniciales */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={iniciarCamara}
              type="button"
              disabled={cargandoCamara}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#0f83b2] to-[#0db1ec] text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
            >
              <Camera size={22} />
              Abrir Cámara
            </button>
            
            <label className={`flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold cursor-pointer transition-all hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg`}>
              <Upload size={22} />
              Subir Archivo
              <input
                type="file"
                accept="image/*"
                onChange={handleArchivoSeleccionado}
                className="hidden"
              />
            </label>
          </div>
          
          <p className={`text-center text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Puedes tomar una foto con la cámara o subir una imagen desde tu dispositivo
          </p>
        </div>
      )}
    </div>
  );
}