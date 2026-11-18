const prisma = require('../config/prisma');

const ESTADOS_VALIDOS = ['ACTIVO', 'INACTIVO'];

async function cambiarEstadoTransportista(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de transportista inválido.' });
    }

    const estado = String(req.body?.estado || '').trim().toUpperCase();
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'El estado debe ser ACTIVO o INACTIVO.' });
    }

    const existente = await prisma.usuario.findFirst({
      where: { id, rol: 'REPARTIDOR' },
      select: { id: true },
    });

    if (!existente) {
      return res.status(404).json({ error: 'El transportista no existe o no corresponde a un repartidor.' });
    }

    const transportista = await prisma.usuario.update({
      where: { id },
      data: { estado },
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
    });

    return res.json({
      mensaje: 'Estado operativo actualizado',
      transportista,
    });
  } catch (err) {
    console.error('Error al cambiar estado operativo del transportista:', err);
    return res.status(500).json({ error: 'Error interno al actualizar el estado operativo.' });
  }
}

module.exports = { cambiarEstadoTransportista };
