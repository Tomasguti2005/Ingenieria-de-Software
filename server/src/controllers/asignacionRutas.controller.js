const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

/**
 * Escenarios 1, 2, 3, 4, 5 y 6: Asignar o modificar el transportista de una ruta
 */
const asignarTransportistaARuta = async (req, res) => {
  const rutaId = Number(req.params.id);
  const transportistaId = Number(req.body?.transportistaId);
  const { forzarModificacion } = req.body || {};
  // 'forzarModificacion' nos permite diferenciar el Escenario 2 (error) del Escenario 6 (modificación exitosa)

  if (!Number.isInteger(rutaId) || rutaId <= 0 || !Number.isInteger(transportistaId) || transportistaId <= 0) {
    return error(res, 'Debe proporcionar un ID de transportista.', 400);
  }

  try {
    const ruta = await prisma.ruta.findUnique({
      where: { id: rutaId },
      include: { pedidos: true }
    });

    if (!ruta) return error(res, 'La ruta especificada no existe.', 404);

    // ESCENARIO 3: Ruta sin pedidos
    if (ruta.pedidos.length === 0) {
      return error(res, 'Esta ruta no cuenta con pedidos asignados', 400);
    }

    // ESCENARIO 2: Ruta ya tiene asignado un transportista (y no se pidió modificar explícitamente)
    if (ruta.transportistaId && ruta.transportistaId !== transportistaId && !forzarModificacion) {
      return error(res, 'Esta ruta ya tiene un transportista asignado', 400);
    }

    // Buscamos al transportista
    const transportista = await prisma.usuario.findUnique({
      where: { id: transportistaId }
    });

    if (!transportista || transportista.rol !== 'REPARTIDOR') {
      return error(res, 'El usuario seleccionado no existe o no es un transportista.', 404);
    }

    // ESCENARIO 5: Transportista no disponible
    if (transportista.estado !== 'ACTIVO') {
      return error(res, 'El transportista no se encuentra disponible', 400);
    }

    // ESCENARIO 4: Transportista sin vehículo
    if (!transportista.vehiculo || transportista.vehiculo.trim() === '') {
      return error(res, 'El transportista no tiene un vehículo asignado', 400);
    }

    // ESCENARIO 1 y 6: Asignación / Modificación exitosa
    const rutaActualizada = await prisma.$transaction(async (tx) => {
      const actualizada = await tx.ruta.update({
        where: { id: rutaId },
        data: { transportistaId: transportista.id }
      });

      await tx.pedido.updateMany({
        where: { rutaId },
        data: { repartidorId: transportista.id }
      });

      return actualizada;
    });

    return success(res, {
      mensaje: 'El sistema asignó el transportista seleccionado a la ruta correctamente.',
      ruta: rutaActualizada
    }, 200);

  } catch (err) {
    console.error('Error al asignar transportista a ruta:', err);
    return error(res, 'Error interno del servidor.', 500);
  }
};

/**
 * Escenario 7: Eliminar transportista de la ruta
 */
const removerTransportistaDeRuta = async (req, res) => {
  const rutaId = Number(req.params.id);

  if (!Number.isInteger(rutaId) || rutaId <= 0) {
    return error(res, 'Debe proporcionar un ID de ruta válido.', 400);
  }

  try {
    const ruta = await prisma.ruta.findUnique({ where: { id: rutaId } });

    if (!ruta) return error(res, 'La ruta especificada no existe.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.ruta.update({
        where: { id: rutaId },
        data: { transportistaId: null }
      });

      await tx.pedido.updateMany({
        where: { rutaId },
        data: { repartidorId: null }
      });
    });

    return success(res, {
      mensaje: 'Transportista eliminado, la ruta no tiene transportista asignado'
    }, 200);

  } catch (err) {
    console.error('Error al remover transportista de ruta:', err);
    return error(res, 'Error interno del servidor.', 500);
  }
};

module.exports = {
  asignarTransportistaARuta,
  removerTransportistaDeRuta
};