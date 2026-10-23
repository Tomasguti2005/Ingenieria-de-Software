// Servicio base para llamadas a la API del backend.
// Usa VITE_API_URL definida en .env

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Wrapper de fetch con headers de autenticación y manejo de errores.
 * @param {string} endpoint - Ruta relativa (ej: '/admin/pedidos')
 * @param {object} opciones - Opciones adicionales de fetch
 * @returns {Promise<object>} Respuesta parseada { success, data, error }
 */
export async function fetchAPI(endpoint, opciones = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opciones.headers,
    },
  };

  const respuesta = await fetch(`${API_URL}${endpoint}`, config);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la solicitud');
  }

  return datos;
}
