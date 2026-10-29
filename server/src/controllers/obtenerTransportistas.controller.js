const prisma = require('../config/prisma');
const { error } = require('../utils/response');

const obtenerTransportistas = async (req, res) => {
  try {
    const transportistas = await prisma.usuario.findMany({
      where: { rol: 'REPARTIDOR' },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        vehiculo: true,
        estado: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, data: transportistas });
  } catch (err) {
    console.error('Error al obtener la lista de transportistas:', err);
    return error(res, 'Ocurrió un error al intentar obtener los transportistas.', 500);
  }
};

module.exports = {
  obtenerTransportistas
};