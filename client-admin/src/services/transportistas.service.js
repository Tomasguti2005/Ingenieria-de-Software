// transportistas.service.js — Capa de datos para gestión de transportistas.
// Representa el modelo Usuario (rol REPARTIDOR) según schema.prisma.
// Convención de respuesta: { success: boolean, data?: any, error?: string }

import { fetchAPI } from './api.js';

// ─── MODO MOCK ────────────────────────────────────────────────────────────────
// En 'true' mientras la API /api/admin/transportistas esté en desarrollo.
export const USAR_MOCK = true;

// Mock mutable de transportistas para pruebas (array compartido entre funciones):
export const MOCK_TRANSPORTISTAS = [
  {
    id: 1,
    nombre: 'Lucas',
    apellido: 'Gómez',
    email: 'lucas.gomez@repartosya.com',
    telefono: '+54221456789',
    rol: 'REPARTIDOR',
    estado: 'ACTIVO',
    vehiculo: 'Moto',
    createdAt: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 2,
    nombre: 'Matías',
    apellido: 'Fernández',
    email: 'matias.f@repartosya.com',
    telefono: '+54221654321',
    rol: 'REPARTIDOR',
    estado: 'ACTIVO',
    vehiculo: 'Camioneta',
    createdAt: '2024-02-20T14:15:00.000Z',
  },
  {
    id: 3,
    nombre: 'Agustina',
    apellido: 'Álvarez',
    email: 'agustina.alvarez@repartosya.com',
    telefono: '+54221987654',
    rol: 'REPARTIDOR',
    estado: 'ACTIVO',
    vehiculo: 'Auto',
    createdAt: '2023-11-05T09:00:00.000Z',
  },
  {
    id: 4,
    nombre: 'Joaquín',
    apellido: 'Benítez',
    email: 'j.benitez@repartosya.com',
    telefono: '+54221321456',
    rol: 'REPARTIDOR',
    estado: 'INACTIVO',
    vehiculo: 'Moto',
    createdAt: '2024-03-10T11:45:00.000Z',
  },
  {
    id: 5,
    nombre: 'Carolina',
    apellido: 'Romero',
    email: 'caro.romero@repartosya.com',
    telefono: '+54221112233',
    rol: 'REPARTIDOR',
    estado: 'ACTIVO',
    vehiculo: 'Bicicleta',
    createdAt: '2024-04-01T16:20:00.000Z',
  },
  {
    id: 6,
    nombre: 'Esteban',
    apellido: 'Quaranta',
    email: 'esteban.q@repartosya.com',
    telefono: '+54221998877',
    rol: 'REPARTIDOR',
    estado: 'INACTIVO',
    vehiculo: 'Auto',
    createdAt: '2023-09-18T08:10:00.000Z',
  },
];

/**
 * Obtiene la lista completa de transportistas.
 * @returns {Promise<Array<object>>}
 */
export async function obtenerTransportistas() {
  if (USAR_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_TRANSPORTISTAS]), 300);
    });
  }
  const respuesta = await fetchAPI('/admin/transportistas');
  return respuesta.data || [];
}

/**
 * Registrar un nuevo transportista (Historia: Crear Cuenta al Transportista)
 * @param {Object} nuevoTransportista
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function crearTransportista(nuevoTransportista) {
  if (USAR_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const creado = {
          ...nuevoTransportista,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          estado: 'ACTIVO',
          rol: 'REPARTIDOR',
        };
        MOCK_TRANSPORTISTAS.unshift(creado);
        resolve({ success: true, data: creado });
      }, 300);
    });
  }
  const respuesta = await fetchAPI('/admin/transportistas', {
    method: 'POST',
    body: JSON.stringify(nuevoTransportista),
  });
  return respuesta;
}

/**
 * Modificar los datos de un transportista (Historia: Modificar Transportista)
 * Escenario 1 → 200: datos actualizados con éxito
 * Escenario 2 → 400: campos inválidos o vacíos
 * Escenario 3 → 409: correo ya registrado
 * @param {number|string} id
 * @param {Object} datos - { nombre, apellido, email, telefono, vehiculo, estado }
 * @returns {Promise<{success: boolean, data: object}>}
 */

/**
 * Eliminar / dar de baja a un transportista (Historia: Eliminar Transportista)
 * Escenario 1 → éxito
 * Escenario 3 → error registrado en log del sistema
 * @param {number|string} id
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function eliminarTransportista(id) {
  const idNum = Number(id);
  if (USAR_MOCK) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = MOCK_TRANSPORTISTAS.findIndex((t) => t.id === idNum);
        if (index === -1) {
          reject(new Error(`Transportista con ID ${id} no encontrado en el sistema`));
          return;
        }
        const eliminado = MOCK_TRANSPORTISTAS.splice(index, 1)[0];
        resolve({ success: true, data: eliminado });
      }, 300);
    });
  }
  const respuesta = await fetchAPI(`/admin/transportistas/${id}`, {
    method: 'DELETE',
  });
  return respuesta;
}
