/* Estado HTTP  Significado
   200          Devuelve los datos del transportista solicitado.
   400          Debe especificar un transportista válido.
   404          El transportista no existe o no corresponde a un repartidor.
   500          Error interno del servidor al obtener los datos.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Controlador para obtener un transportista por su ID.
 * Ruta sugerida: GET /api/transportistas/:id
 */
const getTransportista = async (req, res) => {
  const transportistaId = Number(req.params?.id);

  if (!Number.isInteger(transportistaId) || transportistaId <= 0) {
    return error(res, 'Debe especificar un transportista válido.', 400);
  }

  try {
    const transportista = await prisma.usuario.findUnique({
      where: { id: transportistaId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        estado: true,
        vehiculo: true,
        rol: true,
      },
    });

    if (!transportista || transportista.rol !== 'REPARTIDOR') {
      return error(res, 'El transportista no existe o no corresponde a un repartidor.', 404);
    }

    return success(
      res,
      {
        id: transportista.id,
        nombre: transportista.nombre,
        apellido: transportista.apellido,
        email: transportista.email,
        telefono: transportista.telefono,
        estado: transportista.estado,
        vehiculo: transportista.vehiculo,
      },
      200
    );
  } catch (err) {
    console.error('Error al obtener el transportista:', err);
    return error(res, 'Error interno del servidor al obtener los datos.', 500);
  }
};

module.exports = {
  getTransportista,
};