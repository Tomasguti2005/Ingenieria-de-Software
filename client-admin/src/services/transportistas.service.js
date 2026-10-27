// transportistas.service.js — Capa de datos para gestión de transportistas.
// Representa el modelo Usuario (rol REPARTIDOR) según schema.prisma.
// Convención de respuesta: { success: boolean, data?: any, error?: string }

import { fetchAPI } from './api.js';

// ─── MODO MOCK ────────────────────────────────────────────────────────────────
// En 'true' mientras la API /api/admin/transportistas esté en desarrollo.
export const USAR_MOCK = true;

// Mock inicial de transportistas para pruebas:
export const MOCK_TRANSPORTISTAS = [
  {
    id: 1,
    nombre: 'Lucas',
    apellido: 'Gómez',
    email: 'lucas.gomez@repartosya.com',
    telefono: '+54 221 456-7890',
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
    telefono: '+54 221 654-3210',
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
    telefono: '+54 221 987-6543',
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
    telefono: '+54 221 321-4567',
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
    telefono: '+54 221 112-2334',
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
    telefono: '+54 221 998-8776',
    rol: 'REPARTIDOR',
    estado: 'INACTIVO',
    vehiculo: 'Auto',
    createdAt: '2023-09-18T08:10:00.000Z',
  },
];

/**
 * Obtiene la lista completa de transportistas.
 * @returns {Promise<Array<object>>} Lista de usuarios con rol REPARTIDOR.
 */
export async function obtenerTransportistas() {
  if (USAR_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Devolvemos una copia para evitar mutaciones accidentales
        resolve([...MOCK_TRANSPORTISTAS]);
      }, 400); // Pequeña latencia para efecto de carga fluido
    });
  }

  const respuesta = await fetchAPI('/admin/transportistas');
  return respuesta.data || [];
}
