'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle, Plus, Trash2, Tag, Send,
    Loader2, CheckCircle2, Megaphone
} from 'lucide-react';
// ... (existing imports)
import { useTheme } from 'next-themes';
import Swal from 'sweetalert2';

interface Etiqueta {
    // ...
    id_etiqueta: number;
    nombre: string;
    color: string;
}

interface Aviso {
    id_aviso: number;
    titulo: string;
    mensaje: string;
    etiqueta_nombre: string;
    etiqueta_color: string;
    creador: string;
    fecha_creacion: string;
}

export default function AvisosAdminPage() {
    const { user, hasPermission } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [titulo, setTitulo] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [selectedTag, setSelectedTag] = useState<number | null>(null);

    // New Tag Modal
    const [showTagModal, setShowTagModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('bg-blue-500/10 text-blue-500');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resAvisos, resEtiquetas] = await Promise.all([
                fetch('/api/admin/avisos'),
                fetch('/api/admin/etiquetas')
            ]);

            if (resAvisos.ok) setAvisos(await resAvisos.json());
            if (resEtiquetas.ok) {
                const tags = await resEtiquetas.json();
                setEtiquetas(tags);
                if (tags.length > 0 && !selectedTag) setSelectedTag(tags[0].id_etiqueta);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAviso = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo || !mensaje || !selectedTag) return;

        try {
            setIsSubmitting(true);
            const res = await fetch('/api/admin/avisos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo,
                    mensaje,
                    id_etiqueta: selectedTag,
                    id_usuario: user?.id_usuario
                })
            });

            if (res.ok) {
                setTitulo('');
                setMensaje('');
                fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'Aviso Publicado',
                    text: 'El aviso se ha enviado a todos los usuarios.',
                    timer: 2000,
                    showConfirmButton: false,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#334155'
                });
            }
        } catch (error) {
            console.error('Error creating aviso:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear el aviso',
                background: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#ffffff' : '#334155'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAviso = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#ffffff' : '#334155'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/admin/avisos/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setAvisos(prev => prev.filter(a => a.id_aviso !== id));
                    Swal.fire({
                        title: 'Eliminado',
                        text: 'El aviso ha sido eliminado.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        background: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#ffffff' : '#334155'
                    });
                }
            } catch (error) {
                console.error('Error deleting aviso:', error);
            }
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName) return;
        try {
            const res = await fetch('/api/admin/etiquetas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: newTagName, color: newTagColor })
            });
            if (res.ok) {
                const newTag = await res.json();
                setEtiquetas([...etiquetas, newTag]);
                setShowTagModal(false);
                setNewTagName('');
                Swal.fire({
                    icon: 'success',
                    title: 'Etiqueta Creada',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#334155'
                });
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    if (!hasPermission('ACCESO_AVISOS')) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-gray-500">No tienes permisos para acceder a este módulo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        <Megaphone className="text-[#2dafdc]" />
                        Gestión de Avisos
                    </h1>
                    <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Publica anuncios importantes para todo el personal médico y administrativo.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Creación */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-6 rounded-2xl border sticky top-8 shadow-xl ${isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-100'
                            }`}
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-[#2fcbaf]" />
                            Nuevo Aviso
                        </h2>

                        <form onSubmit={handleCreateAviso} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block opacity-80">Título</label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value)}
                                    className={`w-full p-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-black/20 border-white/10 focus:border-[#2dafdc]' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                                        }`}
                                    placeholder="Ej: Mantenimiento de Servidores"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block opacity-80">Categoría</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedTag || ''}
                                        onChange={e => setSelectedTag(Number(e.target.value))}
                                        className={`flex-1 p-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-black/20 border-white/10 focus:border-[#2dafdc]' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                                            }`}
                                        required
                                    >
                                        {etiquetas.map(tag => (
                                            <option key={tag.id_etiqueta} value={tag.id_etiqueta}>
                                                {tag.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagModal(true)}
                                        className="p-3 rounded-xl bg-[#2dafdc]/10 text-[#2dafdc] hover:bg-[#2dafdc]/20 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block opacity-80">Mensaje</label>
                                <textarea
                                    value={mensaje}
                                    onChange={e => setMensaje(e.target.value)}
                                    className={`w-full p-3 rounded-xl border outline-none transition-all min-h-[120px] ${isDark ? 'bg-black/20 border-white/10 focus:border-[#2dafdc]' : 'bg-gray-50 border-gray-200 focus:border-blue-500'
                                        }`}
                                    placeholder="Escribe el contenido del aviso..."
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0f83b2] to-[#2dafdc] text-white font-bold shadow-lg hover:shadow-[#2dafdc]/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                Publicar Aviso
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* Lista de Avisos Activos */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-[#2dafdc]" />
                        Avisos Activos ({avisos.length})
                    </h2>

                    <div className="grid gap-4">
                        <AnimatePresence>
                            {avisos.map((aviso) => (
                                <motion.div
                                    key={aviso.id_aviso}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`p-5 rounded-2xl border relative group ${isDark ? 'bg-[#0a1929]/60 border-[#0f83b2]/20' : 'bg-white border-gray-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${aviso.etiqueta_color}`}>
                                                    {aviso.etiqueta_nombre}
                                                </span>
                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {new Date(aviso.fecha_creacion).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {aviso.titulo}
                                            </h3>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {aviso.mensaje}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2 italic">
                                                Por: {aviso.creador}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteAviso(aviso.id_aviso)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {avisos.length === 0 && !loading && (
                            <div className="text-center py-12 opacity-50">
                                <p>No hay avisos activos en este momento.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Nueva Etiqueta */}
            {showTagModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-[#0d2137]' : 'bg-white'}`}
                    >
                        <h3 className="text-xl font-bold mb-4">Nueva Categoría</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Nombre (ej: Urgente)"
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'
                                    }`}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    'bg-blue-500/10 text-blue-500',
                                    'bg-red-500/10 text-red-500',
                                    'bg-amber-500/10 text-amber-500',
                                    'bg-purple-500/10 text-purple-500',
                                    'bg-green-500/10 text-green-500',
                                    'bg-gray-500/10 text-gray-500'
                                ].map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewTagColor(color)}
                                        className={`p-2 rounded-lg text-sm font-bold border-2 ${newTagColor === color ? 'border-[#2dafdc]' : 'border-transparent'
                                            } ${color}`}
                                    >
                                        Muestra
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setShowTagModal(false)}
                                    className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateTag}
                                    className="px-4 py-2 rounded-lg bg-[#2dafdc] text-white font-bold"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
