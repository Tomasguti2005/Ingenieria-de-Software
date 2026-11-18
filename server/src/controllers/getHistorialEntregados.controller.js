/* Estado HTTP  Significado
   200          Historial de pedidos entregados obtenido exitosamente (puede ser una lista vacía).
   500          Error interno del servidor al obtener el historial.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Obtiene el historial de pedidos ENTREGADOS.
 * Ruta: GET /api/pedidos/historial-entregados
 *
 * Escenario 1: Éxito y pedidos encontrados -> lista ordenada del más reciente al más antiguo.
 * Escenario 2: Éxito y sin pedidos entregados -> lista vacía (el front muestra el mensaje central).
 *
 * El orden inicial es por fecha de entrega descendente (confirmarEntrega la registra al entregar)
 * y, como desempate, por fecha de creación. Otros criterios de orden/filtro se aplican en el front.
 */
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
      orderBy: [
        { fechaEntrega: 'desc' },
        { fechaCreacion: 'desc' },
      ],
    });

    return success(res, pedidosEntregados, 200);
  } catch (err) {
    console.error('Error al obtener el historial de pedidos entregados:', err);
    return error(res, 'Error interno del servidor al obtener el historial de pedidos entregados.', 500);
  }
};

module.exports = {
  getHistorialEntregados,
};
