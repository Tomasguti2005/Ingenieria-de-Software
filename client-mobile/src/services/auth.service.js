// auth.service.js — Capa de autenticación para client-mobile.
// Endpoint real: POST /api/auth/mobile/login (solo acepta rol REPARTIDOR + estado ACTIVO)
// Convención de respuesta: { success: boolean, data?: any, error?: string }

import { fetchAPI } from './api.js';

// ─── MODO MOCK ────────────────────────────────────────────────────────────────
// Ponelo en false cuando el backend esté listo.
const USAR_MOCK = false;

// Usuarios de prueba que simula el mock:
//   repartidor@repartosya.com / repartidor123  → login exitoso como REPARTIDOR
//   cualquier otro email                        → "id invalido"
//   email válido + clave incorrecta             → "contraseña incorrecta"
const MOCK_USUARIOS = [
  {
    email: 'repartidor@repartosya.com',
    password: 'repartidor123',
    usuario: { id: 2, nombre: 'Carlos', apellido: 'Gómez', rol: 'REPARTIDOR', estado: 'ACTIVO' },
    token: 'mock.jwt.repartidor.token',
  },
];

function mockLoginRepartidor(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const encontrado = MOCK_USUARIOS.find((u) => u.email === email);

      if (!encontrado) {
        reject(new Error('id invalido'));
        return;
      }

      if (encontrado.password !== password) {
        reject(new Error('contraseña incorrecta'));
        return;
      }

      resolve({ success: true, data: { token: encontrado.token, usuario: encontrado.usuario } });
    }, 700); // simula latencia de red
  });
}
// ─── FIN MODO MOCK ────────────────────────────────────────────────────────────

/**
 * Inicia sesión como repartidor.
 * @param {string} email - Email del repartidor
 * @param {string} password - Contraseña del repartidor
 * @returns {Promise<{ token: string, usuario: object }>} Token JWT y datos del usuario
 * @throws {Error} Con mensaje "id invalido", "contraseña incorrecta" u otro error de red
 */
export async function loginRepartidor(email, password) {
  if (USAR_MOCK) {
    return mockLoginRepartidor(email, password);
  }

  // Llamada real al backend cuando USAR_MOCK = false
  const respuesta = await fetchAPI('/auth/mobile/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return respuesta;
}
