const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Permite al repartidor confirmar la entrega de un pedido,
 * validando previamente que el comprobante de pago haya sido registrado.
 */
const confirmarEntrega = async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return error(res, 'ID de pedido inválido.', 400);
    }

    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        id: true,
        estado: true,
        urlComprobante: true,
      },
    });

    if (!pedidoExistente) {
      return error(res, 'El pedido no existe en el sistema.', 404);
    }

    if (!pedidoExistente.urlComprobante || pedidoExistente.urlComprobante.trim().length === 0) {
      return error(res, 'Se debe registrar el pago del pedido para confirmar', 400);
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        estado: 'ENTREGADO',
        fechaEntrega: new Date(),
      },
    });

    return success(
      res,
      {
        mensaje: 'Pedido entregado',
        pedido: pedidoActualizado,
      },
      200
    );
  } catch (err) {
    console.error('Error al confirmar la entrega del pedido:', err);
    return error(res, 'Error interno del servidor al confirmar la entrega.', 500);
  }
};

module.exports = {
  confirmarEntrega,
};
