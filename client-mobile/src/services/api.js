import * as SecureStore from 'expo-secure-store';

// Limpieza de URL por si contiene comillas de más o barras al final
const RAW_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.39:3000/api';
const API_URL = RAW_URL.replace(/["']/g, '').replace(/\/+$/, '');
const TOKEN_KEY = 'auth_token_mobile';
const TIMEOUT_MS = 10000; // 10 segundos máximo

/**
 * Wrapper de fetch para client-mobile con Bearer token y timeout.
 * @param {string} endpoint - Ruta relativa (ej: '/auth/mobile/login')
 * @param {object} opciones - Opciones de fetch (method, body, headers, etc.)
 */
export async function fetchAPI(endpoint, opciones = {}) {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const config = {
    ...opciones,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opciones.headers,
    },
  };

  const rutaCompleta = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const respuesta = await fetch(rutaCompleta, config);
    clearTimeout(timeoutId);

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || 'Error en la solicitud móvil');
    }

    return datos;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(
        `Tiempo de espera agotado al conectar con el servidor (${API_URL}). Verificá que la PC y el celular compartan la red Wi-Fi y que el puerto 3000 esté habilitado.`
      );
    }

    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(
        `No se pudo conectar con el servidor (${API_URL}). Verificá que estés en la misma red Wi-Fi y que el firewall permita la conexión.`
      );
    }

    throw error;
  }
}
