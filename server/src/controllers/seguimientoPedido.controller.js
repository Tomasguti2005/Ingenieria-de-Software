const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Obtiene el código de seguimiento y el enlace para un pedido existente,
 * permitiendo al administrador copiarlo al portapapeles.
 */
const obtenerCodigoSeguimiento = async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);

    if (!pedidoId || Number.isNaN(pedidoId)) {
      return error(res, 'ID de pedido inválido.', 400);
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true, codigoSeguimiento: true },
    });

    if (!pedido) {
      return error(res, 'El pedido no existe en el sistema.', 404);
    }

    const clientOrigin = process.env.ADMIN_ORIGIN || 'http://localhost:5173';
    const enlaceSeguimiento = `${clientOrigin.replace(/\/$/, '')}/seguimiento/${pedido.codigoSeguimiento}`;

    return success(
      res,
      {
        pedidoId: pedido.id,
        codigoSeguimiento: pedido.codigoSeguimiento,
        enlaceSeguimiento,
      },
      200
    );
  } catch (err) {
    console.error('Error al obtener código de seguimiento:', err);
    return error(res, 'Error interno del servidor.', 500);
  }
};

module.exports = {
  obtenerCodigoSeguimiento,
};
