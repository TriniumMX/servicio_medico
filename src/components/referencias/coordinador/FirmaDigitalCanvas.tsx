import { useRef, useState, useEffect } from "react";
import { Pencil, Trash2, Save, Check } from "lucide-react";

interface Props {
  isDark: boolean;
  onFirmaGuardada: (firmaBase64: string) => void;
  firmaExistente?: string | null;
}

export default function FirmaDigitalCanvas({ isDark, onFirmaGuardada, firmaExistente }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [firmaGuardada, setFirmaGuardada] = useState<string | null>(firmaExistente || null);
  const [usandoFirmaGuardada, setUsandoFirmaGuardada] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fondo blanco
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configurar estilo de dibujo
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    // Si hay firma existente, cargarla al canvas
    if (firmaExistente && canvasRef.current) {
      cargarFirmaEnCanvas(firmaExistente);
      setFirmaGuardada(firmaExistente);
      setUsandoFirmaGuardada(true);
      setHasDrawn(true);
    }
  }, [firmaExistente]);

  const cargarFirmaEnCanvas = (firmaBase64: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Limpiar canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar imagen de firma
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = firmaBase64;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    setUsandoFirmaGuardada(false);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setUsandoFirmaGuardada(false);
  };

  const guardarFirma = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    // Convertir canvas a base64
    const firmaBase64 = canvas.toDataURL("image/png");
    setFirmaGuardada(firmaBase64);
    onFirmaGuardada(firmaBase64);
    setUsandoFirmaGuardada(true);
  };

  const usarFirmaGuardada = () => {
    if (!firmaGuardada) return;
    cargarFirmaEnCanvas(firmaGuardada);
    setUsandoFirmaGuardada(true);
    setHasDrawn(true);
    onFirmaGuardada(firmaGuardada);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          <Pencil className="inline w-4 h-4 mr-2" />
          Firma Digital
        </label>
        <div className="flex gap-2">
          {firmaGuardada && !usandoFirmaGuardada && (
            <button
              type="button"
              onClick={usarFirmaGuardada}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isDark
                  ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Usar firma guardada
            </button>
          )}
          {hasDrawn && !usandoFirmaGuardada && (
            <button
              type="button"
              onClick={guardarFirma}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isDark
                  ? "bg-green-500/20 hover:bg-green-500/30 text-green-300"
                  : "bg-green-100 hover:bg-green-200 text-green-700"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              Guardar firma
            </button>
          )}
          <button
            type="button"
            onClick={limpiarCanvas}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isDark
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-300"
                : "bg-red-100 hover:bg-red-200 text-red-700"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>
      </div>

      {usandoFirmaGuardada && (
        <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
          isDark ? "bg-green-500/10 text-green-300" : "bg-green-50 text-green-700"
        }`}>
          <Check className="w-4 h-4" />
          Usando firma guardada
        </div>
      )}

      <div
        className={`relative border-2 rounded-lg overflow-hidden ${
          isDark ? "border-[#0f83b2]/30 bg-white" : "border-gray-300 bg-white"
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 cursor-crosshair touch-none"
          style={{ touchAction: "none" }}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Dibuje su firma aquí</p>
          </div>
        )}
      </div>

      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        {firmaGuardada
          ? "Puede reutilizar su firma guardada o crear una nueva"
          : "Dibuje su firma y haga clic en 'Guardar firma' para reutilizarla en el futuro"}
      </p>
    </div>
  );
}
