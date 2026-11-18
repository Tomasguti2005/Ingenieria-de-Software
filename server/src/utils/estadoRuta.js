/**
 * estadoRuta.js — Reglas compartidas para saber en qué situación está una ruta.
 *
 * - Ruta INICIADA:  tiene al menos un pedido retirado (o posterior).
 * - Ruta TERMINADA: está iniciada y todos sus pedidos están ENTREGADO, FALLIDO o CANCELADO.
 */

// Estados que indican que el pedido ya fue retirado por el transportista
const ESTADOS_PEDIDO_RETIRADO = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO'];

// Estados en los que un pedido ya no requiere más acciones dentro de la ruta
const ESTADOS_PEDIDO_FINALES = ['ENTREGADO', 'FALLIDO', 'CANCELADO'];

function esRutaIniciada(pedidos = []) {
  return pedidos.some((p) => ESTADOS_PEDIDO_RETIRADO.includes(p.estado));
}

function esRutaTerminada(pedidos = []) {
  return esRutaIniciada(pedidos) && pedidos.every((p) => ESTADOS_PEDIDO_FINALES.includes(p.estado));
}

// Inicio del día actual: las rutas creadas antes de esto son de días anteriores
function inicioDelDia() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

/**
 * Rutas del transportista creadas HOY. Las de días anteriores sin terminar quedan
 * "vencidas" (la app mobile ya no las muestra) y no bloquean nuevas asignaciones.
 */
async function obtenerRutasDeTransportista(client, transportistaId, excluirRutaId) {
  return client.ruta.findMany({
    where: {
      transportistaId,
      createdAt: { gte: inicioDelDia() },
      ...(excluirRutaId && { id: { not: excluirRutaId } }),
    },
    include: { pedidos: { select: { estado: true } } },
  });
}

/**
 * Devuelve la primera ruta del transportista que todavía no terminó (o null).
 * Sirve para impedir que un transportista tenga dos rutas asignadas al mismo tiempo.
 */
async function obtenerRutaSinTerminarDeTransportista(client, transportistaId, excluirRutaId = null) {
  const rutas = await obtenerRutasDeTransportista(client, transportistaId, excluirRutaId);
  return rutas.find((r) => !esRutaTerminada(r.pedidos)) || null;
}

/**
 * Devuelve la ruta que el transportista ya comenzó y aún no terminó (o null).
 */
async function obtenerRutaEnCursoDeTransportista(client, transportistaId) {
  const rutas = await obtenerRutasDeTransportista(client, transportistaId, null);
  return rutas.find((r) => esRutaIniciada(r.pedidos) && !esRutaTerminada(r.pedidos)) || null;
}

module.exports = {
  ESTADOS_PEDIDO_RETIRADO,
  ESTADOS_PEDIDO_FINALES,
  esRutaIniciada,
  esRutaTerminada,
  obtenerRutaSinTerminarDeTransportista,
  obtenerRutaEnCursoDeTransportista,
};
