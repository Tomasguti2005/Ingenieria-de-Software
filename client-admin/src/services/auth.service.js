// auth.service.js — Capa de autenticación para client-admin.
// Endpoint real: POST /api/auth/admin/login (solo acepta rol ADMIN).
// Convención de respuesta: { success: boolean, data?: any, error?: string }

import { fetchAPI } from './api.js';

/**
 * Inicia sesión como administrador.
 * @param {string} email - Email del admin (campo único según schema.prisma)
 * @param {string} password - Contraseña del admin
 * @returns {Promise<{ token: string, usuario: object }>} Token JWT y datos del usuario
 * @throws {Error} Con mensaje "id invalido", "contraseña incorrecta" u otro error de red
 */
export async function loginAdmin(email, password) {
  const respuesta = await fetchAPI('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!respuesta.success || !respuesta.data?.token || !respuesta.data?.usuario) {
    throw new Error('El servidor devolvió una respuesta de inicio de sesión incompleta.');
  }

  return respuesta;
}
