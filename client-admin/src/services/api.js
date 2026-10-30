// Servicio base para llamadas a la API del backend.
// Usa VITE_API_URL definida en .env

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

/**
 * Wrapper de fetch con headers de autenticación y manejo de errores.
 * @param {string} endpoint - Ruta relativa (ej: '/admin/pedidos')
 * @param {object} opciones - Opciones adicionales de fetch
 * @returns {Promise<object>} Respuesta parseada { success, data, error }
 */
export async function fetchAPI(endpoint, opciones = {}) {
  const token = sessionStorage.getItem('token');

  const config = {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opciones.headers,
    },
  };

  const respuesta = await fetch(`${API_URL}${endpoint}`, config);
  const texto = await respuesta.text();
  let datos = {};

  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new Error('El servidor devolvió una respuesta inválida.');
    }
  }

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la solicitud');
  }

  return datos;
}
