// auth.service.js — Capa de autenticación para client-mobile.
// Endpoint real: POST /api/auth/mobile/login (solo acepta rol REPARTIDOR + estado ACTIVO)
// Convención de respuesta: { success: boolean, data?: any, error?: string }

import { fetchAPI } from './api.js';

/**
 * Inicia sesión como repartidor.
 * @param {string} email - Email del repartidor
 * @param {string} password - Contraseña del repartidor
 * @returns {Promise<{ token: string, usuario: object }>} Token JWT y datos del usuario
 * @throws {Error} Con mensaje "id invalido", "contraseña incorrecta" u otro error de red
 */
export async function loginRepartidor(email, password) {
  const respuesta = await fetchAPI('/auth/mobile/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return respuesta;
}
