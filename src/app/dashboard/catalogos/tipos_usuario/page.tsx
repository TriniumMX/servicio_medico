'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Search, Plus, Pencil, Trash2, Users, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTiposUsuario } from '@/hooks/catalogos/useTiposUsuario';
import type { TipoUsuario } from '@/types/catalogos/usuarios-proveedores.types';

export default function TiposUsuarioPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  const {
    tipos,
    loading,
    fetchTiposUsuario,
    createTipoUsuario,
    updateTipoUsuario,
    deleteTipoUsuario,
  } = useTiposUsuario();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<TipoUsuario | null>(null);
  const [formValue, setFormValue] = useState('');

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchTiposUsuario(); }, [fetchTiposUsuario]);

  const filtered = tipos.filter(t =>
    t.tipousuario.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setModalMode('create');
    setSelected(null);
    setFormValue('');
    setModalOpen(true);
  };

  const handleEdit = (tipo: TipoUsuario) => {
    setModalMode('edit');
    setSelected(tipo);
    setFormValue(tipo.tipousuario);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValue.trim()) return;

    let success = false;
    if (modalMode === 'create') {
      success = await createTipoUsuario(formValue.trim());
    } else if (selected) {
      success = await updateTipoUsuario(selected.clavetipousuario, formValue.trim());
    }
    if (success) setModalOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Tipos de Usuario
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Administra los roles disponibles en el sistema
            </p>
          </div>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nuevo tipo
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar tipo de usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`block w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-sky-500/20 text-sm
              ${isDark
                ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 shadow-sm'
              }`}
          />
        </div>

        {/* Table */}
        <div className={`rounded-xl overflow-hidden ring-1 ${isDark ? 'ring-white/10' : 'ring-slate-200 shadow-sm'}`}>
          {/* Table header */}
          <div className={`grid grid-cols-[1fr_auto] gap-4 px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Tipo de usuario
            </div>
            <div className="text-right">Acciones</div>
          </div>

          {/* Rows */}
          <div className={isDark ? 'bg-slate-800/30' : 'bg-white'}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className={`h-10 w-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {search ? 'Sin resultados para esta búsqueda' : 'No hay tipos de usuario registrados'}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((tipo, idx) => (
                  <motion.div
                    key={tipo.clavetipousuario}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`grid grid-cols-[1fr_auto] gap-4 items-center px-4 sm:px-5 py-3.5 transition-colors
                      ${idx !== filtered.length - 1
                        ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100'
                        : ''
                      }
                      ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                        ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                        {tipo.clavetipousuario}
                      </div>
                      <span className={`text-sm font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {tipo.tipousuario}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(tipo)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-sky-400' : 'hover:bg-slate-100 text-slate-400 hover:text-sky-600'}`}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTipoUsuario(tipo.clavetipousuario, tipo.tipousuario)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-100 text-slate-400 hover:text-rose-600'}`}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <div className={`px-4 sm:px-5 py-2.5 text-xs ${isDark ? 'bg-slate-800/50 text-slate-500 border-t border-white/5' : 'bg-slate-50 text-slate-400 border-t border-slate-100'}`}>
              {filtered.length} de {tipos.length} registro{tipos.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

            {/* Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800 ring-1 ring-white/10' : 'bg-white ring-1 ring-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {modalMode === 'create' ? 'Nuevo tipo de usuario' : 'Editar tipo de usuario'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nombre del tipo
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Ej: Médico general"
                  className={`block w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-sky-500/20 text-sm
                    ${isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                    }`}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!formValue.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-medium text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {modalMode === 'create' ? 'Crear' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
