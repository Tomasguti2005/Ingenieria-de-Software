// auth.service.js — Capa de autenticación para client-admin.
// Endpoint real: POST /api/auth/admin/login (solo acepta rol ADMIN).
// Convención de respuesta: { success: boolean, data?: any, error?: string }

import { fetchAPI } from './api.js';

// ─── MODO MOCK ────────────────────────────────────────────────────────────────
// Ponelo en false cuando el backend esté listo.
const USAR_MOCK = true;

// Usuarios de prueba que simula el mock:
//   admin@repartosya.com / admin123  → login exitoso como ADMIN
//   cualquier otro email              → "id invalido"
//   email válido + clave incorrecta   → "contraseña incorrecta"
const MOCK_USUARIOS = [
  {
    email: 'admin@repartosya.com',
    password: 'admin123',
    usuario: { id: 1, nombre: 'Martín', apellido: 'Rol', rol: 'ADMIN' },
    token: 'mock.jwt.admin.token',
  },
];

function mockLoginAdmin(email, password) {
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
 * Inicia sesión como administrador.
 * @param {string} email - Email del admin (campo único según schema.prisma)
 * @param {string} password - Contraseña del admin
 * @returns {Promise<{ token: string, usuario: object }>} Token JWT y datos del usuario
 * @throws {Error} Con mensaje "id invalido", "contraseña incorrecta" u otro error de red
 */
export async function loginAdmin(email, password) {
  if (USAR_MOCK) {
    return mockLoginAdmin(email, password);
  }

  // Llamada real al backend cuando USAR_MOCK = false
  const respuesta = await fetchAPI('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return respuesta;
}
