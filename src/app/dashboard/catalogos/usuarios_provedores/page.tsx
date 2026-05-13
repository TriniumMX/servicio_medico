// src/app/(dashboard)/catalogos/usuarios/page.tsx

'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUsuariosProveedores } from '@/hooks/catalogos/useUsuariosProveedores';
import { UsuarioConTipo } from '@/types/catalogos/usuarios-proveedores.types';
import ProveedorModal from '@/components/catalogos/usuarios-proveedores/ProveedorModal';
import DeleteConfirmModal from '@/components/catalogos/usuarios-proveedores/DeleteConfirmModal';

const ITEMS_PER_PAGE = 10;

export default function UsuariosProveedoresPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    usuarios,
    tiposUsuarios,
    loading,
    error,
    createUsuario,
    updateUsuario,
    deleteUsuario
  } = useUsuariosProveedores();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioConTipo | null>(null);

  // Filtrado de usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch =
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.cedula_profesional?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === '' || usuario.id_tipousuario?.toString() === filterTipo;

    return matchesSearch && matchesTipo;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // Reset a página 1 cuando cambian los filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterTipo(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: UsuarioConTipo) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (usuario: UsuarioConTipo) => {
    setSelectedUsuario(usuario);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUsuario) {
      const success = await deleteUsuario(selectedUsuario.id_usuario);
      if (success) {
        setIsDeleteModalOpen(false);
        setSelectedUsuario(null);
      }
    }
  };

  const handleSubmit = async (data: any) => {
    if (selectedUsuario) {
      return await updateUsuario(selectedUsuario.id_usuario, data);
    } else {
      return await createUsuario(data);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Usuarios y Proveedores
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Gestión de usuarios del sistema y proveedores médicos
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0db1ec] hover:bg-[#0a8ec4] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0db1ec]/20"
        >
          <Plus className="h-5 w-5" />
          Nuevo Usuario/Proveedor
        </motion.button>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o cédula..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white placeholder-gray-500 focus:border-[#0db1ec]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0db1ec]'
              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
            />
          </div>

          <div>
            <select
              value={filterTipo}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-[#0d2137] border-[#0f83b2]/30 text-white focus:border-[#0db1ec]'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-[#0db1ec]'
              } focus:outline-none focus:ring-2 focus:ring-[#0db1ec]/20`}
            >
              <option value="">Todos los tipos</option>
              {tiposUsuarios.map((tipo) => (
                <option key={tipo.clavetipousuario} value={tipo.clavetipousuario}>
                  {tipo.tipousuario}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`mt-3 flex items-center justify-between text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <span>
            Mostrando{' '}
            <span className="font-semibold text-[#0db1ec]">
              {filteredUsuarios.length === 0 ? 0 : startIndex + 1}
            </span>
            {' '}-{' '}
            <span className="font-semibold text-[#0db1ec]">
              {Math.min(endIndex, filteredUsuarios.length)}
            </span>
            {' '}de{' '}
            <span className="font-semibold">{filteredUsuarios.length}</span> registros
          </span>
          {totalPages > 1 && (
            <span>
              Página <span className="font-semibold text-[#0db1ec]">{currentPage}</span> de{' '}
              <span className="font-semibold">{totalPages}</span>
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-[#0a1929] border-[#0f83b2]/20' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-[#0d2137]' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ID
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nombre
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tipo
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Usuario
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Contacto
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Estado
                </th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#0f83b2]/20' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0db1ec]"></div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        Cargando...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : currentUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UserPlus className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          No se encontraron usuarios
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Intenta ajustar los filtros o crea un nuevo usuario
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsuarios.map((usuario) => (
                  <motion.tr
                    key={usuario.id_usuario}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#0d2137]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className={`px-6 py-4 text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {usuario.id_usuario}
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div>
                        <div className="font-medium">{usuario.nombre}</div>
                        {usuario.cedula_profesional && (
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Cédula: {usuario.cedula_profesional}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        isDark ? 'bg-[#0db1ec]/10 text-[#0db1ec]' : 'bg-[#0db1ec]/10 text-[#0db1ec]'
                      }`}>
                        {usuario.tipousuario}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {usuario.username}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="space-y-1">
                        {usuario.celular && (
                          <div>{usuario.celular}</div>
                        )}
                        {usuario.telefono && (
                          <div className="text-xs">{usuario.telefono}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {usuario.activo ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-[#0db1ec]/10 text-gray-400 hover:text-[#0db1ec]'
                              : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                          }`}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(usuario)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                              : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                          }`}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#0f83b2]/20' : 'border-gray-200'
          }`}>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? isDark
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isDark
                  ? 'bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Mostrar solo algunas páginas para no saturar
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => goToPage(pageNumber)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-[#0db1ec] text-white'
                          : isDark
                          ? 'bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return (
                    <span
                      key={pageNumber}
                      className={`px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? isDark
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isDark
                  ? 'bg-[#0d2137] hover:bg-[#0f83b2]/20 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Siguiente
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUsuario(null);
        }}
        onSubmit={handleSubmit}
        proveedor={selectedUsuario}
        tiposUsuarios={tiposUsuarios}
        isDark={isDark}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUsuario(null);
        }}
        onConfirm={handleDeleteConfirm}
        proveedorNombre={selectedUsuario?.nombre || ''}
        isDark={isDark}
      />
    </div>
  );
}