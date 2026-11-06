// pedidosService.js — Servicio para gestión de pedidos con soporte para Mockup desacoplable.
// Cuando el backend esté listo, cambiar USE_MOCK a false o configurar VITE_USE_PEDIDOS_MOCK=false en .env

import { fetchAPI } from './api';

// Bandera para alternar entre Mock local y Backend real
export const USE_MOCK = false;

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
  const lista = Array.isArray(res) ? res : res.data || [];

  // Normalizamos nombres de campos para que coincidan con la interfaz
  return lista.map((p) => {
    const nombreTransportista =
      p.nombreTransportista ||
      (p.repartidor
        ? `${p.repartidor.nombre || ''} ${p.repartidor.apellido || ''}`.trim()
        : null);

    return {
      ...p,
      nombreTransportista,
      diaEntrega: p.diaEntrega || (p.fechaEntrega ? p.fechaEntrega.split('T')[0] : ''),
    };
  });
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
      fechaEntrega: datos.diaEntrega ? new Date(datos.diaEntrega + 'T12:00:00Z').toISOString() : undefined,
      descripcionProductos: datos.descripcionProductos || 'Paquete general',
      estado: datos.repartidorId ? 'ASIGNADO' : 'REGISTRADO',
    }),
  });

  return res;
}

/**
 * Obtiene las rutas activas/disponibles para asignar a un pedido
 */
export async function obtenerRutasDisponibles() {
  if (USE_MOCK) {
    return [
      { id: 1, nombre: 'Ruta 1 - Casco Urbano La Plata' },
      { id: 2, nombre: 'Ruta 2 - Gonnet / City Bell' },
      { id: 3, nombre: 'Ruta 3 - Los Hornos' },
    ];
  }

  const res = await fetchAPI('/rutas');
  return res.data || [];
}

/**
 * Obtiene un pedido por su identificador
 */
export async function obtenerPedidoPorId(id) {
  const pedidoId = Number(id);
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const p = mockPedidos.find((item) => item.id === pedidoId);
    if (!p) throw new Error('El pedido no existe en el sistema.');
    return { ...p };
  }

  const pedidos = await obtenerPedidosVigentes();
  const encontrado = pedidos.find((item) => item.id === pedidoId);
  if (!encontrado) {
    throw new Error('El pedido no existe en el sistema.');
  }
  return encontrado;
}

/**
 * Modifica los datos de un pedido existente.
 * Lanza error si:
 * - El pedido ya está en camino (bloqueo por distribución).
 * - El código de seguimiento ya existe (409 Conflict).
 * - La fecha de entrega es anterior a hoy (400 Bad Request).
 */
export async function modificarPedido(id, datos) {
  const pedidoId = Number(id);

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const index = mockPedidos.findIndex((p) => p.id === pedidoId);
    if (index === -1) {
      throw new Error('El pedido no existe en el sistema.');
    }

    const actual = mockPedidos[index];

    // Validación estado
    const bloqueados = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO', 'CANCELADO'];
    if (bloqueados.includes(actual.estado)) {
      const err = new Error(
        'Operación no permitida: no se pueden modificar los datos de un pedido que ya se encuentra en camino con el transportista.'
      );
      err.status = 400;
      throw err;
    }

    // Validación código duplicado
    if (datos.codigoSeguimiento && datos.codigoSeguimiento.trim() !== actual.codigoSeguimiento) {
      const repetido = mockPedidos.some(
        (p) => p.id !== pedidoId && p.codigoSeguimiento?.toLowerCase() === datos.codigoSeguimiento.trim().toLowerCase()
      );
      if (repetido) {
        const err = new Error('El identificador del pedido ya existe. ¿Desea eliminar el pedido actual?');
        err.status = 409;
        throw err;
      }
    }

    // Validación fecha pasada (evitar discrepancias horarias)
    if (datos.fechaEntrega || datos.diaEntrega) {
      const fechaVal = datos.diaEntrega || datos.fechaEntrega.split('T')[0];
      const hoyStr = new Date().toISOString().split('T')[0];
      if (fechaVal < hoyStr) {
        const err = new Error('La fecha de entrega ingresada es anterior a la actual. Debe cambiarla o eliminar el pedido.');
        err.status = 400;
        throw err;
      }
    }

    const actualizado = {
      ...actual,
      ...datos,
      id: pedidoId,
      fechaEntrega: datos.fechaEntrega ? new Date(datos.fechaEntrega).toISOString() : actual.fechaEntrega,
      diaEntrega: datos.diaEntrega || (datos.fechaEntrega ? datos.fechaEntrega.split('T')[0] : actual.diaEntrega),
    };

    mockPedidos[index] = actualizado;
    return {
      success: true,
      mensaje: 'El pedido ha sido modificado con éxito',
      data: actualizado,
    };
  }

  const res = await fetchAPI(`/pedidos/${pedidoId}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });

  return res;
}

/**
 * Elimina un pedido del sistema si se encuentra en estado REGISTRADO o ASIGNADO.
 */
export async function eliminarPedido(id) {
  const pedidoId = Number(id);

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const pedido = mockPedidos.find((p) => p.id === pedidoId);
    if (!pedido) {
      throw new Error('El pedido no existe en el sistema.');
    }

    const bloqueados = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO', 'CANCELADO'];
    if (bloqueados.includes(pedido.estado)) {
      throw new Error('No puede eliminarse un pedido en estados posteriores al retiro.');
    }

    mockPedidos = mockPedidos.filter((p) => p.id !== pedidoId);
    return { success: true, mensaje: 'Pedido eliminado exitosamente', idEliminado: pedidoId };
  }

  const res = await fetchAPI(`/pedidos/${pedidoId}`, {
    method: 'DELETE',
  });

  return res;
}
