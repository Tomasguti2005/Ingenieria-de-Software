/* Estado HTTP  Significado
   200          Transportistas obtenidos exitosamente.
   500          Error interno del servidor al consultar los transportistas.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Obtiene el listado completo de transportistas (usuarios con rol REPARTIDOR).
 * No expone contraseñas hacia el front-end por motivos de seguridad.
 */
const obtenerTransportistas = async (req, res) => {
  try {
    const { estado } = req.query;

    const where = {
      rol: 'REPARTIDOR',
      ...(estado && { estado: String(estado).toUpperCase() }),
    };

    const transportistas = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        estado: true,
        vehiculo: true,
        createdAt: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return success(res, transportistas, 200);
  } catch (err) {
    console.error('Error al obtener transportistas:', err);
    return error(res, 'Error interno del servidor al obtener los transportistas.', 500);
  }
};

module.exports = {
  obtenerTransportistas,
};

