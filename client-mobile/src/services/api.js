import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = 'auth_token_mobile';

/**
 * Wrapper de fetch para client-mobile con Bearer token.
 * @param {string} endpoint - Ruta relativa (ej: '/mobile/pedidos')
 * @param {object} opciones - Opciones de fetch (method, body, headers, etc.)
 */
export async function fetchAPI(endpoint, opciones = {}) {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

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
    throw new Error(datos.error || 'Error en la solicitud móvil');
  }

  return datos;
}
