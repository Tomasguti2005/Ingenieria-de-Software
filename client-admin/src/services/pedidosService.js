// pedidosService.js — Servicio para gestión de pedidos con soporte para Mockup desacoplable.
// Cuando el backend esté listo, cambiar USE_MOCK a false o configurar VITE_USE_PEDIDOS_MOCK=false en .env

import { fetchAPI } from './api';

// Bandera para alternar entre Mock local y Backend real
export const USE_MOCK = true;

// Mock data en memoria para pruebas frontend
let mockPedidos = [
  {
    id: 1,
    codigoSeguimiento: 'PED-1001',
    direccionOrigen: 'Calle 12 #450, La Plata',
    direccionDestino: 'Av. 7 #1220, La Plata',
    destinatarioNombre: 'Juan Carlos Pérez',
    destinatarioTelefono: '2214567890',
    descripcionProductos: 'Caja con insumos de librería',
    diaEntrega: '2026-11-05',
    fechaEntrega: '2026-11-05T14:00:00.000Z',
    nombreTransportista: 'Carlos Gómez',
    repartidorId: 1,
    estado: 'REGISTRADO',
    notas: 'Tocar timbre 3B',
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 2,
    codigoSeguimiento: 'PED-1002',
    direccionOrigen: 'Calle 50 #830, La Plata',
    direccionDestino: 'Diagonal 74 #210, La Plata',
    destinatarioNombre: 'María López',
    destinatarioTelefono: '2219876543',
    descripcionProductos: 'Indumentaria deportiva',
    diaEntrega: '2026-11-05',
    fechaEntrega: '2026-11-05T16:30:00.000Z',
    nombreTransportista: 'Carlos Gómez',
    repartidorId: 1,
    estado: 'ASIGNADO',
    notas: '',
    createdAt: '2026-11-02T11:30:00.000Z',
  },
  {
    id: 3,
    codigoSeguimiento: 'PED-1003',
    direccionOrigen: 'Calle 6 #1100, La Plata',
    direccionDestino: 'Calle 13 #520, La Plata',
    destinatarioNombre: 'Roberto Fernández',
    destinatarioTelefono: '2213344556',
    descripcionProductos: 'Componentes electrónicos',
    diaEntrega: '2026-11-06',
    fechaEntrega: '2026-11-06T11:00:00.000Z',
    nombreTransportista: 'Mariano Ruiz',
    repartidorId: 2,
    estado: 'EN_CAMINO',
    notas: 'Dejar en recepción si no atiende',
    createdAt: '2026-11-03T09:15:00.000Z',
  },
  {
    id: 4,
    codigoSeguimiento: 'PED-1004',
    direccionOrigen: 'Camino Centenario 2450, Gonnet',
    direccionDestino: 'Calle 14 #890, City Bell',
    destinatarioNombre: 'Lucía Benítez',
    destinatarioTelefono: '2215566778',
    descripcionProductos: 'Artículos de bazar',
    diaEntrega: '2026-11-04',
    fechaEntrega: '2026-11-04T12:00:00.000Z',
    nombreTransportista: 'Carlos Gómez',
    repartidorId: 1,
    estado: 'RETIRADO',
    notas: 'Avisar 10 minutos antes por WhatsApp',
    createdAt: '2026-11-04T08:00:00.000Z',
  }
];

/**
 * Obtiene la lista de transportistas para los selects del formulario
 */
export async function obtenerTransportistasDisponibles() {
  if (USE_MOCK) {
    return [
      { id: 1, nombreCompleto: 'Carlos Gómez', nombre: 'Carlos', apellido: 'Gómez' },
      { id: 2, nombreCompleto: 'Mariano Ruiz', nombre: 'Mariano', apellido: 'Ruiz' },
      { id: 3, nombreCompleto: 'Esteban Morales', nombre: 'Esteban', apellido: 'Morales' },
    ];
  }

  const res = await fetchAPI('/admin/transportistas');
  return res.data || [];
}

/**
 * Obtiene la lista de pedidos vigentes
 */
export async function obtenerPedidosVigentes() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return [...mockPedidos];
  }

  const res = await fetchAPI('/pedidos');
  return res.data || [];
}

/**
 * Crea un nuevo pedido con validación.
 * Campos obligatorios requeridos:
 * - direccionOrigen
 * - direccionDestino
 * - diaEntrega
 * - destinatarioNombre
 * - nombreTransportista
 * El estado inicial es siempre REGISTRADO (la transición la realiza el repartidor).
 */
export async function crearPedido(datos) {
  const {
    direccionOrigen,
    direccionDestino,
    diaEntrega,
    destinatarioNombre,
    nombreTransportista,
    notas,
  } = datos;

  // Validación estricta de campos obligatorios
  if (
    !direccionOrigen?.trim() ||
    !direccionDestino?.trim() ||
    !diaEntrega?.trim() ||
    !destinatarioNombre?.trim() ||
    !nombreTransportista?.trim()
  ) {
    throw new Error('Falta completar campos obligatorios, intente nuevamente');
  }

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const nuevoPedido = {
      id: mockPedidos.length ? Math.max(...mockPedidos.map((p) => p.id)) + 1 : 1,
      codigoSeguimiento: `PED-${1000 + (mockPedidos.length + 1)}`,
      direccionOrigen: direccionOrigen.trim(),
      direccionDestino: direccionDestino.trim(),
      destinatarioNombre: destinatarioNombre.trim(),
      destinatarioTelefono: datos.destinatarioTelefono || '',
      descripcionProductos: datos.descripcionProductos || 'Paquete general',
      diaEntrega: diaEntrega.trim(),
      fechaEntrega: new Date(diaEntrega).toISOString(),
      nombreTransportista: nombreTransportista.trim(),
      repartidorId: datos.repartidorId || null,
      estado: 'REGISTRADO',
      notas: (notas || '').trim(),
      urlComprobante: null,
      createdAt: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(),
    };

    mockPedidos = [nuevoPedido, ...mockPedidos];
    return { success: true, data: nuevoPedido, mensaje: 'Pedido realizado' };
  }

  const res = await fetchAPI('/pedidos', {
    method: 'POST',
    body: JSON.stringify({
      ...datos,
      estado: 'REGISTRADO',
    }),
  });

  return res;
}
