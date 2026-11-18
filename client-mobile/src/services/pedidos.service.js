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
