'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  total:     number;
  porPagina: number;
  pagina:    number;
  onChange:  (p: number) => void;
  isDark:    boolean;
  label?:    string; // e.g. "grupos" | "referencias"
}

export default function Paginacion({ total, porPagina, pagina, onChange, isDark, label = 'registros' }: Props) {
  const totalPaginas = Math.ceil(total / porPagina);
  if (totalPaginas <= 1) return null;

  const desde = (pagina - 1) * porPagina + 1;
  const hasta  = Math.min(pagina * porPagina, total);

  // Generar números de página con elipsis
  const paginas: (number | '...')[] = [];
  if (totalPaginas <= 7) {
    for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
  } else {
    paginas.push(1);
    if (pagina > 3) paginas.push('...');
    for (let i = Math.max(2, pagina - 1); i <= Math.min(totalPaginas - 1, pagina + 1); i++) paginas.push(i);
    if (pagina < totalPaginas - 2) paginas.push('...');
    paginas.push(totalPaginas);
  }

  const btn     = 'flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold transition-all';
  const active  = 'bg-[#0f83b2] text-white shadow';
  const inactive = isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100';
  const arrow   = `${btn} border ${isDark ? 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800' : 'border-gray-200 text-gray-500 hover:bg-gray-100'} disabled:opacity-30 disabled:cursor-not-allowed`;

  return (
    <div className={`flex items-center justify-between px-1 pt-4 pb-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {desde}–{hasta} de {total} {label}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(pagina - 1)} disabled={pagina === 1} className={arrow}>
          <ChevronLeft size={14} />
        </button>
        {paginas.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className={`w-8 text-center text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)} className={`${btn} ${pagina === p ? active : inactive}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas} className={arrow}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
