const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const getHistorialEntregados = async (req, res) => {
  try {
    const pedidosEntregados = await prisma.pedido.findMany({
      where: { estado: 'ENTREGADO' },
      include: {
        repartidor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return success(res, pedidosEntregados, 200);
  } catch (err) {
    console.error('Error al obtener el historial de pedidos entregados:', err);
    return error(res, 'Error interno del servidor al obtener el historial de pedidos entregados.', 500);
  }
};

module.exports = getHistorialEntregados;