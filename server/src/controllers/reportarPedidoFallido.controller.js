const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Permite al repartidor reportar un pedido como no entregado (FALLIDO),
 * guardando obligatoriamente el motivo del fallo para su posterior reasignación.
 */
const reportarPedidoFallido = async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return error(res, 'ID de pedido inválido.', 400);
    }

    const rawMotivo = req.body?.motivoFallo ?? req.body?.motivo;

    if (typeof rawMotivo !== 'string' || rawMotivo.trim().length === 0) {
      return error(res, 'se debe completar el campo de motivo', 400);
    }

    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true, rutaId: true },
    });

    if (!pedidoExistente) {
      return error(res, 'El pedido no existe en el sistema.', 404);
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        estado: 'FALLIDO',
        motivoFallo: rawMotivo.trim(),
      },
    });

    if (pedidoExistente.rutaId) {
      const yaEnCamino = await prisma.pedido.findFirst({
        where: {
          rutaId: pedidoExistente.rutaId,
          estado: 'EN_CAMINO',
        },
        select: { id: true },
      });

      if (!yaEnCamino) {
        const siguienteRetirado = await prisma.pedido.findFirst({
          where: {
            rutaId: pedidoExistente.rutaId,
            estado: 'RETIRADO',
          },
          orderBy: [
            { ordenEntrega: 'asc' },
            { id: 'asc' },
          ],
          select: { id: true },
        });

        if (siguienteRetirado) {
          await prisma.pedido.update({
            where: { id: siguienteRetirado.id },
            data: { estado: 'EN_CAMINO' },
          });
        }
      }
    }

    return success(res, pedidoActualizado, 200);
  } catch (err) {
    console.error('Error al reportar pedido fallido:', err);
    return error(res, 'Error interno del servidor al reportar el pedido.', 500);
  }
};

module.exports = {
  reportarPedidoFallido,
};
