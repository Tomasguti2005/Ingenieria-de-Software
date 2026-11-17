/* Estado HTTP  Significado
   200          Estado operativo actualizado exitosamente.
   400          Debe especificar un transportista válido o el estado es inválido.
   404          El transportista no existe o no corresponde a un repartidor.
   500          Error interno del servidor al actualizar el estado operativo.
*/

const prisma = require('../config/prisma');
const { error } = require('../utils/response');

// Enum EstadoRepartidor definido en schema.prisma (ACTIVO, INACTIVO)
let EstadoRepartidor;
try {
  ({ EstadoRepartidor } = require('@prisma/client'));
} catch (_) {
  EstadoRepartidor = { ACTIVO: 'ACTIVO', INACTIVO: 'INACTIVO' };
}
if (!EstadoRepartidor) {
  EstadoRepartidor = { ACTIVO: 'ACTIVO', INACTIVO: 'INACTIVO' };
}

/**
 * Controlador para editar el estado operativo de un transportista.
 * 
 * Historia de Usuario:
 * "Como Administrador quiero editar el estado operativo de cada para mantener actualizada la nómina de personal."
 * 
 * Regla:
 * - Los estados operativos posibles son "Activo" e "Inactivo".
 * - Se mapean directamente al enum EstadoRepartidor de Prisma: ACTIVO e INACTIVO.
 * 
 * Criterios de Aceptación:
 * - ESCENARIO 1: Actualización exitosa
 *   El administrador modifica estado actual de un chofer y confirma.
 *   El sistema actualiza el registro y muestra: "Estado operativo actualizado".
 * 
 * - ESCENARIO 2: Actualización fallida
 *   El administrador quiere modificar el estado de un transportista que no existe (HTTP 404).
 */
const editarEstadoOperativo = async (req, res) => {
  // El ID puede venir por parámetro de ruta (/api/admin/transportistas/:id/estado) o en el cuerpo de la petición
  const idParam = req.params?.id ?? req.body?.id;
  const transportistaId = Number(idParam);

  if (!idParam || Number.isNaN(transportistaId) || !Number.isInteger(transportistaId) || transportistaId <= 0) {
    return error(res, 'Debe especificar un transportista válido para modificar.', 400);
  }

  const estadoRecibido = req.body?.estado ?? req.body?.estadoOperativo;

  // Validación: presencia del campo de estado
  if (!estadoRecibido || typeof estadoRecibido !== 'string' || estadoRecibido.trim() === '') {
    return error(res, 'Debe especificar el estado operativo ("Activo" o "Inactivo").', 400);
  }

  const estadoLimpio = estadoRecibido.trim().toUpperCase();

  // Regla: Los estados operativos posibles son "Activo" e "Inactivo", mapeados al enum EstadoRepartidor
  let nuevoEstado;
  if (estadoLimpio === EstadoRepartidor.ACTIVO || estadoLimpio === 'ACTIVO') {
    nuevoEstado = EstadoRepartidor.ACTIVO;
  } else if (estadoLimpio === EstadoRepartidor.INACTIVO || estadoLimpio === 'INACTIVO') {
    nuevoEstado = EstadoRepartidor.INACTIVO;
  } else {
    return error(res, 'Los estados operativos posibles son "Activo" e "Inactivo".', 400);
  }

  try {
    // ESCENARIO 2: Actualización fallida - El transportista no existe o no es repartidor
    const transportistaExistente = await prisma.usuario.findUnique({
      where: { id: transportistaId },
    });

    if (!transportistaExistente || transportistaExistente.rol !== 'REPARTIDOR') {
      return error(res, 'El transportista no existe o no corresponde a un repartidor.', 404);
    }

    // ESCENARIO 1: Actualización exitosa en la base de datos con el enum EstadoRepartidor
    const transportistaActualizado = await prisma.usuario.update({
      where: { id: transportistaId },
      data: {
        estado: nuevoEstado, // Enum EstadoRepartidor (ACTIVO / INACTIVO)
      },
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

    return res.status(200).json({
      success: true,
      mensaje: 'Estado operativo actualizado',
      data: {
        mensaje: 'Estado operativo actualizado',
        transportista: transportistaActualizado,
      },
    });
  } catch (err) {
    console.error('Error al editar el estado operativo del transportista:', err);
    return error(res, 'Error interno del servidor al actualizar el estado operativo.', 500);
  }
};

module.exports = {
  editarEstadoOperativo,
};
