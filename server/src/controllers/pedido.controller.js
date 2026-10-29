/* Estado HTTP  Significado
   200          Pedidos obtenidos exitosamente.
   500          Error interno del servidor al consultar los pedidos.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Obtiene el listado completo de pedidos registrados.
 * Permite filtrar por estado a través de query params (ej: /pedidos?estado=REGISTRADO).
 */
const obtenerPedidos = async (req, res) => {
  try {
    const { estado } = req.query;

    const where = {
      ...(estado && { estado: String(estado).toUpperCase() }),
    };

    const pedidos = await prisma.pedido.findMany({
      where,
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

    return success(res, pedidos, 200);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    return error(res, 'Error interno del servidor al obtener los pedidos.', 500);
  }
};

module.exports = {
  obtenerPedidos,
};

