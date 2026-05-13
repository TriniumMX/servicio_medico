'use client';

import { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64: string) => void;
  isDark: boolean;
}

export default function SignatureModal({ isOpen, onClose, onSave, isDark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  }, [isOpen]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasSignature) setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
  };


  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  // Función para recortar el espacio vacío del canvas
  const trimCanvas = (c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const copy = document.createElement('canvas').getContext('2d');
    if (!copy) return c;

    const pixels = ctx.getImageData(0, 0, c.width, c.height);
    const l = pixels.data.length;
    let i, x, y;
    const bound = { top: -1, left: -1, right: -1, bottom: -1 };

    // Buscar el top
    for (i = 0; i < l; i += 4) {
      if (pixels.data[i + 3] !== 0) {
        x = (i / 4) % c.width;
        y = ~~((i / 4) / c.width);

        if (bound.top === -1) {
          bound.top = y;
        }

        if (bound.left === -1 || x < bound.left) {
          bound.left = x;
        }

        if (bound.right === -1 || x > bound.right) {
          bound.right = x;
        }

        if (bound.bottom === -1 || y > bound.bottom) {
          bound.bottom = y;
        }
      }
    }

    // Si no se encontró nada (canvas vacío)
    if (bound.top === -1) return c;

    const trimHeight = bound.bottom - bound.top + 1;
    const trimWidth = bound.right - bound.left + 1;
    const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

    const copyCanvas = document.createElement('canvas');
    copyCanvas.width = trimWidth;
    copyCanvas.height = trimHeight;
    const copyCtx = copyCanvas.getContext('2d');
    if (copyCtx) {
      copyCtx.putImageData(trimmed, 0, 0);
      return copyCanvas;
    }

    return c;
  };

  const save = () => {
    if (!hasSignature) {
      Swal.fire({
        icon: 'warning',
        title: 'Firma requerida',
        text: 'Por favor firme antes de guardar.'
      });
      return;
    }
    if (canvasRef.current) {
      // Recortar antes de guardar
      const tempCanvas = trimCanvas(canvasRef.current);
      const dataURL = tempCanvas.toDataURL('image/png');
      onSave(dataURL);
      // Limpiar al guardar para la próxima
      clear();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-[#0a1929]' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Firma Digital</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Canvas Area */}
        <div className="p-4 bg-gray-100 flex justify-center">
          <div className="border-2 border-dashed border-gray-400 rounded-lg bg-white touch-none">
            <canvas
              ref={canvasRef}
              width={350}
              height={200}
              className="cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 py-2">Dibuje su firma dentro del recuadro</p>

        {/* Footer */}
        <div className={`flex gap-3 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={clear}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
          >
            <Eraser size={16} /> Limpiar
          </button>
          <button
            onClick={save}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0db1ec] text-white font-bold hover:bg-[#0a8ec4]"
          >
            <Check size={16} /> Guardar y Firmar
          </button>
        </div>
      </div>
    </div>
  );
}