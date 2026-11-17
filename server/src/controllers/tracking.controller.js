const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const obtenerSeguimiento = async (req, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { codigoSeguimiento: String(req.params.codigo) },
      select: {
        codigoSeguimiento: true,
        estado: true,
        descripcionProductos: true,
        fechaEntrega: true,
        repartidor: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!pedido) {
      return error(res, 'No se encontró un pedido con ese código de seguimiento.', 404);
    }

    return success(res, pedido);
  } catch (err) {
    console.error('Error al obtener el seguimiento del pedido:', err);
    return error(res, 'Error interno del servidor al obtener el seguimiento.', 500);
  }
};

module.exports = { obtenerSeguimiento };
