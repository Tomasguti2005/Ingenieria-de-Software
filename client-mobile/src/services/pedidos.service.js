import { fetchAPI } from './api';

export async function obtenerPedidosAsignados() {
  const respuesta = await fetchAPI('/mobile/pedidos');

  if (respuesta.success !== true || !Array.isArray(respuesta.data)) {
    throw new Error('La respuesta de pedidos móviles no tiene un formato válido.');
  }

  return respuesta.data;
}

export async function actualizarRetiroPedido(pedidoId, retirado) {
  const respuesta = await fetchAPI(`/mobile/pedidos/${pedidoId}/retiro`, {
    method: 'PATCH',
    body: JSON.stringify({ retirado }),
  });

  if (respuesta.success !== true || !respuesta.data) {
    throw new Error('No se pudo actualizar el estado de retiro del pedido.');
  }

  return respuesta.data;
}

export async function iniciarViaje(pedidosIds) {
  const respuesta = await fetchAPI('/mobile/viaje/iniciar', {
    method: 'POST',
    body: JSON.stringify({ pedidosIds }),
  });

  if (respuesta.success !== true || !Array.isArray(respuesta.data)) {
    throw new Error('No se pudo iniciar el viaje.');
  }

  return respuesta.data;
}

export async function cargarPagoPedido(pedidoId, { uri, fileName, metodoPagoCobrado, montoCobrado }) {
  const respuesta = await fetchAPI(`/pedidos/${pedidoId}/cargar-pago`, {
    method: 'PATCH',
    body: JSON.stringify({
      urlComprobante: uri || fileName || `comprobante-${pedidoId}.jpg`,
      metodoPagoCobrado,
      montoCobrado,
    }),
  });

  if (respuesta.success !== true) {
    throw new Error('No se pudo cargar el comprobante de pago.');
  }

  return respuesta.data;
}

export async function confirmarEntregaPedido(pedidoId) {
  const respuesta = await fetchAPI(`/pedidos/${pedidoId}/confirmar-entrega`, {
    method: 'PATCH',
  });

  if (respuesta.success !== true) {
    throw new Error('No se pudo confirmar la entrega del pedido.');
  }

  return respuesta.data;
}

export async function reportarPedidoFallido(pedidoId, motivoFallo) {
  const respuesta = await fetchAPI(`/pedidos/${pedidoId}/reportar-fallido`, {
    method: 'PATCH',
    body: JSON.stringify({ motivoFallo }),
  });

  if (respuesta.success !== true) {
    throw new Error('No se pudo reportar el pedido como fallido.');
  }

  return respuesta.data;
}

// ─── SEGUIMIENTO PÚBLICO DE PEDIDOS (CLIENTE FINAL) ───────────────────────────
const MOCK_SEGUIMIENTO_PEDIDOS = [
  {
    codigoSeguimiento: 'PED-MOB-001',
    estado: 'EN_CAMINO',
    descripcionProductos: 'Caja con insumos de librería (3x Cuadernos A4, 2x Lapiceras)',
    direccionDestino: 'Av. 7 #1220, La Plata',
    destinatarioNombre: 'Juan Pérez',
    transportista: {
      nombre: 'Lucas',
      apellido: 'Gómez',
      telefono: '+54 221 456-7890',
      vehiculo: 'Moto Honda Wave (Patente A123BCD)',
    },
    fechaActualizacion: new Date().toISOString(),
  },
  {
    codigoSeguimiento: 'PED-MOB-002',
    estado: 'ASIGNADO',
    descripcionProductos: 'Indumentaria deportiva (Zapatillas Running talle 42)',
    direccionDestino: 'Diagonal 74 #210, La Plata',
    destinatarioNombre: 'María López',
    transportista: {
      nombre: 'Matías',
      apellido: 'Fernández',
      telefono: '+54 221 654-3210',
      vehiculo: 'Camioneta Renault Kangoo (Patente AF 456 CD)',
    },
    fechaActualizacion: new Date().toISOString(),
  },
  {
    codigoSeguimiento: 'PED-MOB-003',
    estado: 'ENTREGADO',
    descripcionProductos: 'Componentes electrónicos (Placa Arduino, Sensores)',
    direccionDestino: 'Calle 13 #520, La Plata',
    destinatarioNombre: 'Roberto Fernández',
    transportista: {
      nombre: 'Agustina',
      apellido: 'Álvarez',
      telefono: '+54 221 987-6543',
      vehiculo: 'Auto Chevrolet Onix (Patente AD 789 EF)',
    },
    fechaActualizacion: new Date().toISOString(),
  },
];

/**
 * Consulta el estado de un pedido para el "Cliente final".
 * Escenario 1: Código válido -> Devuelve estado, productos y datos básicos del transportista.
 * Escenario 2: Código inválido, roto o inexistente -> Lanza error con el mensaje de aceptación exacto:
 * "El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible"
 * @param {string} codigo - Código único de seguimiento
 * @returns {Promise<object>}
 */
export async function obtenerSeguimientoPedido(codigo) {
  const codigoLimpio = String(codigo || '').trim().toUpperCase();

  if (!codigoLimpio) {
    throw new Error('El enlace de seguimiento no es válido');
  }

  if (USAR_MOCK_PEDIDOS) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const pedido = MOCK_SEGUIMIENTO_PEDIDOS.find(
      (p) => p.codigoSeguimiento.toUpperCase() === codigoLimpio
    );

    if (!pedido) {
      throw new Error('El enlace de seguimiento no es válido');
    }

    return pedido;
  }

  try {
    const respuesta = await fetchAPI(`/tracking/${encodeURIComponent(codigoLimpio)}`);
    if (!respuesta || !respuesta.data) {
      throw new Error('El enlace de seguimiento no es válido');
    }
    return respuesta.data;
  } catch (_) {
    throw new Error('El enlace de seguimiento no es válido');
  }
}
