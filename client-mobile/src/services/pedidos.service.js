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
