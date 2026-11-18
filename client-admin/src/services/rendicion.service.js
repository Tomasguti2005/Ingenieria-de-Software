import { fetchAPI } from './api.js';

// ─── MODO MOCK ────────────────────────────────────────────────────────────────
// Cambiar a true para probar el frontend con datos locales sin backend.
export const USAR_MOCK = false;

const MOCK_RENDICION_DIARIA = [
  { id: 1, nombre: 'Carlos', apellido: 'Gómez', entregas: 14, monto: 84500 },
  { id: 2, nombre: 'Lucía', apellido: 'Fernández', entregas: 11, monto: 67200 },
  { id: 3, nombre: 'Martín', apellido: 'Rodríguez', entregas: 16, monto: 98400 },
  { id: 4, nombre: 'Sofía', apellido: 'Pérez', entregas: 9, monto: 51300 },
  { id: 5, nombre: 'Diego', apellido: 'López', entregas: 12, monto: 73800 },
];

const MOCK_RENDICION_MENSUAL = [
  { id: 1, nombre: 'Carlos', apellido: 'Gómez', entregas: 284, monto: 1742000 },
  { id: 2, nombre: 'Lucía', apellido: 'Fernández', entregas: 245, monto: 1510500 },
  { id: 3, nombre: 'Martín', apellido: 'Rodríguez', entregas: 312, monto: 1965800 },
  { id: 4, nombre: 'Sofía', apellido: 'Pérez', entregas: 198, monto: 1184000 },
  { id: 5, nombre: 'Diego', apellido: 'López', entregas: 260, monto: 1620400 },
];

/**
 * Obtiene la rendición de cuentas diaria o mensual por transportista.
 * @param {object} params
 * @param {'diaria'|'mensual'} params.modo
 * @param {string} [params.fecha] - Formato YYYY-MM-DD (para modo diaria)
 * @param {string} [params.mes] - Formato YYYY-MM (para modo mensual)
 * @returns {Promise<{ modo: string, periodo: string, items: Array, resumen: object }>}
 */
export async function obtenerRendicion({ modo = 'diaria', fecha, mes } = {}) {
  if (USAR_MOCK) {
    const items = modo === 'diaria' ? MOCK_RENDICION_DIARIA : MOCK_RENDICION_MENSUAL;
    const totalGeneral = items.reduce((acc, item) => acc + item.monto, 0);
    const totalEntregas = items.reduce((acc, item) => acc + item.entregas, 0);
    return {
      modo,
      periodo: modo === 'diaria' ? fecha : mes,
      items: [...items],
      resumen: {
        totalGeneral,
        totalEntregas,
        cantidadTransportistas: items.length,
        promedioPorTransportista: items.length > 0 ? totalGeneral / items.length : 0,
      },
    };
  }

  const query = new URLSearchParams({ modo });
  if (modo === 'diaria' && fecha) {
    query.set('fecha', fecha);
  } else if (modo === 'mensual' && mes) {
    query.set('mes', mes);
  }

  const respuesta = await fetchAPI(`/admin/rendicion?${query.toString()}`);
  return respuesta.data;
}
