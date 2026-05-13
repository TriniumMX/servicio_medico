// src/services/catalogos/usuarios-proveedores.service.ts

import { executeQuery, executeQueryOne } from '@/lib/dbPostgres';
import {
  TipoUsuario,
  Usuario,
  UsuarioConTipo,
  CreateUsuarioDTO,
  UpdateUsuarioDTO
} from '@/types/catalogos/usuarios-proveedores.types';
import bcrypt from 'bcryptjs';

export class UsuariosService {

  /**
   * Obtiene todos los tipos de usuarios
   */
  static async getTiposUsuarios(): Promise<TipoUsuario[]> {
    return await executeQuery<TipoUsuario>(`
      SELECT clavetipousuario, tipousuario
      FROM tiposusuarios
      ORDER BY clavetipousuario
    `);
  }

  /**
   * Obtiene todos los usuarios con información del tipo de usuario
   */
  static async getAllUsuarios(): Promise<UsuarioConTipo[]> {
    return await executeQuery<UsuarioConTipo>(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.cedula_profesional,
        u.id_especialidad,
        u.id_hospital,
        u.telefono,
        u.celular,
        u.email,
        u.direccion,
        u.colonia,
        u.username,
        u.id_tipousuario,
        u.activo,
        u.costo,
        u.fecha_creacion,
        u.fecha_modificacion,
        t.tipousuario,
        h.nombre_hospital,
        e.especialidad
      FROM usuarios u
      LEFT JOIN tiposusuarios t ON u.id_tipousuario = t.clavetipousuario
      LEFT JOIN hospitales h ON u.id_hospital = h.id_hospital
      LEFT JOIN especialidades e ON u.id_especialidad = e.claveespecialidad
      ORDER BY u.id_usuario DESC
    `);
  }

  /**
   * Obtiene un usuario por su ID
   */
  static async getUsuarioById(id: number): Promise<UsuarioConTipo | null> {
    return await executeQueryOne<UsuarioConTipo>(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.cedula_profesional,
        u.id_especialidad,
        u.id_hospital,
        u.telefono,
        u.celular,
        u.email,
        u.direccion,
        u.colonia,
        u.username,
        u.id_tipousuario,
        u.activo,
        u.costo,
        u.fecha_creacion,
        u.fecha_modificacion,
        t.tipousuario,
        h.nombre_hospital,
        e.especialidad
      FROM usuarios u
      LEFT JOIN tiposusuarios t ON u.id_tipousuario = t.clavetipousuario
      LEFT JOIN hospitales h ON u.id_hospital = h.id_hospital
      LEFT JOIN especialidades e ON u.id_especialidad = e.claveespecialidad
      WHERE u.id_usuario = $1
    `, [id]);
  }

  /**
   * Verifica si un username ya existe
   */
  static async verificarUsernameExiste(username: string, excludeId?: number): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM usuarios
      WHERE username = $1
    `;

    const params: any[] = [username];

    if (excludeId) {
      query += ' AND id_usuario != $2';
      params.push(excludeId);
    }

    const result = await executeQueryOne<{ count: string }>(query, params);
    return result ? parseInt(result.count) > 0 : false;
  }

  /**
   * Verifica si un email ya existe
   */
  static async verificarEmailExiste(email: string, excludeId?: number): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM usuarios
      WHERE email = $1
    `;

    const params: any[] = [email];

    if (excludeId) {
      query += ' AND id_usuario != $2';
      params.push(excludeId);
    }

    const result = await executeQueryOne<{ count: string }>(query, params);
    return result ? parseInt(result.count) > 0 : false;
  }

  /**
   * Crea un nuevo usuario
   */
  static async createUsuario(data: CreateUsuarioDTO): Promise<Usuario> {
    // Verificar si el username ya existe
    const usernameExiste = await this.verificarUsernameExiste(data.username);
    if (usernameExiste) {
      throw new Error('El username ya está registrado');
    }

    // Verificar si el email ya existe (si se proporciona)
    if (data.email) {
      const emailExiste = await this.verificarEmailExiste(data.email);
      if (emailExiste) {
        throw new Error('El email ya está registrado');
      }
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await executeQueryOne<Usuario>(`
      INSERT INTO usuarios (
        nombre,
        cedula_profesional,
        id_especialidad,
        id_hospital,
        telefono,
        celular,
        email,
        direccion,
        colonia,
        username,
        password,
        id_tipousuario,
        costo,
        activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      data.nombre,
      data.cedula_profesional || null,
      data.id_especialidad || null,
      data.id_hospital || null,
      data.telefono || null,
      data.celular || null,
      data.email || null,
      data.direccion || null,
      data.colonia || null,
      data.username,
      hashedPassword,
      data.id_tipousuario,
      data.costo || null,
      data.activo !== undefined ? data.activo : true
    ]);

    if (!result) {
      throw new Error('Error al crear el usuario');
    }

    return result;
  }

  /**
   * Actualiza un usuario existente
   */
  static async updateUsuario(id: number, data: UpdateUsuarioDTO): Promise<Usuario> {
    // Verificar si el usuario existe
    const usuarioExiste = await this.getUsuarioById(id);
    if (!usuarioExiste) {
      throw new Error('Usuario no encontrado');
    }

    // Si se está actualizando el username, verificar que no exista
    if (data.username) {
      const usernameExiste = await this.verificarUsernameExiste(data.username, id);
      if (usernameExiste) {
        throw new Error('El username ya está registrado');
      }
    }

    // Si se está actualizando el email, verificar que no exista
    if (data.email) {
      const emailExiste = await this.verificarEmailExiste(data.email, id);
      if (emailExiste) {
        throw new Error('El email ya está registrado');
      }
    }

    // Construir la consulta dinámica solo con los campos que se envían
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      values.push(data.nombre);
      paramCount++;
    }
    if (data.cedula_profesional !== undefined) {
      updates.push(`cedula_profesional = $${paramCount}`);
      values.push(data.cedula_profesional);
      paramCount++;
    }
    if (data.id_especialidad !== undefined) {
      updates.push(`id_especialidad = $${paramCount}`);
      values.push(data.id_especialidad);
      paramCount++;
    }
    if (data.id_hospital !== undefined) {
      updates.push(`id_hospital = $${paramCount}`);
      values.push(data.id_hospital);
      paramCount++;
    }
    if (data.telefono !== undefined) {
      updates.push(`telefono = $${paramCount}`);
      values.push(data.telefono);
      paramCount++;
    }
    if (data.celular !== undefined) {
      updates.push(`celular = $${paramCount}`);
      values.push(data.celular);
      paramCount++;
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(data.email);
      paramCount++;
    }
    if (data.direccion !== undefined) {
      updates.push(`direccion = $${paramCount}`);
      values.push(data.direccion);
      paramCount++;
    }
    if (data.colonia !== undefined) {
      updates.push(`colonia = $${paramCount}`);
      values.push(data.colonia);
      paramCount++;
    }
    if (data.username !== undefined) {
      updates.push(`username = $${paramCount}`);
      values.push(data.username);
      paramCount++;
    }
    if (data.password !== undefined) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updates.push(`password = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }
    if (data.id_tipousuario !== undefined) {
      updates.push(`id_tipousuario = $${paramCount}`);
      values.push(data.id_tipousuario);
      paramCount++;
    }
    if (data.costo !== undefined) {
      updates.push(`costo = $${paramCount}`);
      values.push(data.costo);
      paramCount++;
    }
    if (data.activo !== undefined) {
      updates.push(`activo = $${paramCount}`);
      values.push(data.activo);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No hay datos para actualizar');
    }

    // Agregar el ID al final
    values.push(id);

    const result = await executeQueryOne<Usuario>(`
      UPDATE usuarios
      SET ${updates.join(', ')}
      WHERE id_usuario = $${paramCount}
      RETURNING *
    `, values);

    if (!result) {
      throw new Error('Error al actualizar el usuario');
    }

    return result;
  }

  /**
   * Elimina (desactiva) un usuario
   */
  static async deleteUsuario(id: number): Promise<void> {
    const result = await executeQuery(`
      UPDATE usuarios
      SET activo = FALSE
      WHERE id_usuario = $1
      RETURNING id_usuario
    `, [id]);

    if (result.length === 0) {
      throw new Error('Usuario no encontrado');
    }
  }

  /**
   * Elimina permanentemente un usuario (usar con cuidado)
   */
  static async hardDeleteUsuario(id: number): Promise<void> {
    const result = await executeQuery(`
      DELETE FROM usuarios
      WHERE id_usuario = $1
      RETURNING id_usuario
    `, [id]);

    if (result.length === 0) {
      throw new Error('Usuario no encontrado');
    }
  }
}
