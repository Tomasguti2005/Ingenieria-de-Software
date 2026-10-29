const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener transportistas activos para el select
const obtenerTransportistasActivos = async (req, res) => {
  try {
    const transportistas = await prisma.usuario.findMany({
      where: {
        rol: 'REPARTIDOR',
        estado: 'ACTIVO',
        vehiculo: null
      },
      select: { id: true, nombre: true, apellido: true, vehiculo: true }
    });
    return res.json({ success: true, data: transportistas });
  } catch (error) {
    console.error('Error al obtener transportistas:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener transportistas.' });
  }
};

// Asignar vehículo a transportista
const asignarVehiculoATransportista = async (req, res) => {
  try {
    const { transportistaId, patente } = req.body;

    if (!transportistaId || !patente) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID del transportista y la patente del vehículo.'
      });
    }

    // 1. Buscar al transportista
    const transportista = await prisma.usuario.findUnique({
      where: { id: Number(transportistaId) }
    });

    if (!transportista) {
      return res.status(404).json({
        success: false,
        error: 'El transportista no existe.'
      });
    }

    // ESCENARIO 3: Transportista inactivo
    if (transportista.estado !== 'ACTIVO') {
      return res.status(403).json({
        success: false,
        error: 'El transportista no está activo.'
      });
    }

    // Verificar que el vehículo exista
    const vehiculoExiste = await prisma.vehiculo.findUnique({
      where: { patente }
    });

    if (!vehiculoExiste) {
      return res.status(404).json({
        success: false,
        error: 'El vehículo especificado no se encuentra registrado.'
      });
    }

    // ESCENARIO 2: Vehículo ya asignado a otro chofer activo
    const asignacionExistente = await prisma.usuario.findFirst({
      where: {
        vehiculo: patente,
        estado: 'ACTIVO',
        id: { not: Number(transportistaId) }
      }
    });

    if (asignacionExistente) {
      return res.status(409).json({
        success: false,
        error: 'El vehículo ya se encuentra asignado a otro transportista activo.'
      });
    }

    // ESCENARIO 1: Asignación exitosa
    await prisma.usuario.update({
      where: { id: Number(transportistaId) },
      data: { vehiculo: patente }
    });

    return res.status(200).json({
      success: true,
      message: 'Vehículo vinculado exitosamente al transportista'
    });

  } catch (error) {
    console.error('Error en asignación de vehículo:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor.'
    });
  }
};

module.exports = {
  obtenerTransportistasActivos,
  asignarVehiculoATransportista
};