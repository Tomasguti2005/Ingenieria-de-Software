import { fetchAPI } from './api';

export async function obtenerSeguimiento(codigo) {
  const respuesta = await fetchAPI(`/tracking/${encodeURIComponent(codigo)}`);
  return respuesta.data;
}
