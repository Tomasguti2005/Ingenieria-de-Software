/* Estado HTTP  Significado
   200          Rutas obtenidas exitosamente.
   500          Error interno del servidor al consultar las rutas.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Obtiene el listado completo de rutas registradas.
 * Incluye los datos del transportista asignado y la lista de pedidos asociados.
 */
const obtenerRutas = async (req, res) => {
  try {
    const rutas = await prisma.ruta.findMany({
      include: {
        transportista: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            vehiculo: true,
            estado: true,
          },
        },
        pedidos: {
          select: {
            id: true,
            codigoSeguimiento: true,
            direccionOrigen: true,
            direccionDestino: true,
            destinatarioNombre: true,
            destinatarioTelefono: true,
            descripcionProductos: true,
            estado: true,
            ordenEntrega: true,
          },
          orderBy: {
            ordenEntrega: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return success(res, rutas, 200);
  } catch (err) {
    console.error('Error al obtener rutas:', err);
    return error(res, 'Error interno del servidor al obtener las rutas.', 500);
  }
};

module.exports = {
  obtenerRutas,
};

