/* Estado HTTP  Significado
   200          Pedidos obtenidos o pedido eliminado exitosamente.
   201          Pedido creado exitosamente.
   400          Campos obligatorios incompletos o identificador inválido.
   404          Pedido no encontrado en el sistema.
   500          Error interno del servidor.
*/

const crypto = require('crypto');
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

/**
 * Crea un nuevo pedido simple.
 * Espera datos mínimos obligatorios: direccionOrigen, direccionDestino, destinatarioNombre, destinatarioTelefono, descripcionProductos.
 */
const crearPedido = async (req, res) => {
  try {
    const {
      direccionOrigen,
      direccionDestino,
      destinatarioNombre,
      destinatarioTelefono,
      descripcionProductos,
      notas,
      montoCobrado,
      codigoSeguimiento,
      repartidorId,
      fechaEntrega,
    } = req.body || {};

    // Validación de campos obligatorios
    if (
      !direccionOrigen ||
      !direccionDestino ||
      !destinatarioNombre ||
      !destinatarioTelefono ||
      !descripcionProductos
    ) {
      return error(
        res,
        'Debe completar todos los campos obligatorios del pedido (origen, destino, destinatario, teléfono y productos).',
        400
      );
    }

    // Código de seguimiento: provisto por el front o autogenerado único (ej: RY-A1B2C3)
    const codigoFinal =
      codigoSeguimiento && String(codigoSeguimiento).trim() !== ''
        ? String(codigoSeguimiento).trim()
        : `RY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Verificamos si el código no está duplicado
    const existente = await prisma.pedido.findUnique({
      where: { codigoSeguimiento: codigoFinal },
    });

    if (existente) {
      return error(res, 'El código de seguimiento ya se encuentra registrado.', 400);
    }

    const nuevoPedido = await prisma.pedido.create({
      data: {
        codigoSeguimiento: codigoFinal,
        direccionOrigen: String(direccionOrigen).trim(),
        direccionDestino: String(direccionDestino).trim(),
        destinatarioNombre: String(destinatarioNombre).trim(),
        destinatarioTelefono: String(destinatarioTelefono).trim(),
        descripcionProductos: String(descripcionProductos || 'Paquete general').trim(),
        notas: notas ? String(notas).trim() : null,
        montoCobrado: montoCobrado ? Number(montoCobrado) : null,
        repartidorId: repartidorId ? Number(repartidorId) : null,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        estado: repartidorId ? 'ASIGNADO' : 'REGISTRADO',
      },
    });

    return success(
      res,
      {
        mensaje: 'Pedido creado exitosamente',
        pedido: nuevoPedido,
      },
      201
    );
  } catch (err) {
    console.error('Error al crear el pedido:', err);
    return error(res, 'Error interno del servidor al crear el pedido.', 500);
  }
};

/**
 * Elimina un pedido simple del sistema.
 */
const eliminarPedido = async (req, res) => {
  try {
    const pedidoIdParam = req.params?.id ?? req.body?.id;
    const pedidoId = Number(pedidoIdParam);

    if (!pedidoIdParam || Number.isNaN(pedidoId)) {
      return error(res, 'Debe especificar un identificador de pedido válido para eliminar.', 400);
    }

    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedidoExistente) {
      return error(res, 'El pedido no existe en el sistema.', 404);
    }

    await prisma.pedido.delete({
      where: { id: pedidoId },
    });

    return success(
      res,
      {
        mensaje: 'Pedido eliminado exitosamente',
        idPedidoEliminado: pedidoId,
      },
      200
    );
  } catch (err) {
    console.error('Error al eliminar el pedido:', err);
    return error(res, 'Error interno del servidor al eliminar el pedido.', 500);
  }
};

const modificarPedido = async (req, res) => {
  try {
    // Tomamos el ID interno del pedido desde los parámetros de la URL (ej: /pedidos/5)
    const pedidoId = Number(req.params.id);
    
    if (Number.isNaN(pedidoId)) {
      return error(res, 'ID de pedido inválido.', 400);
    }

    const {
      codigoSeguimiento, // En tu HU se menciona como "ID de pedido único"
      rutaId,            // ruta asignada
      repartidorId,      // transportista asignado
      direccionOrigen,
      direccionDestino,
      destinatarioNombre,
      descripcionProductos,
      fechaEntrega,
      notas,
      estado
    } = req.body || {};

    // 1. Buscamos el pedido actual en la base de datos
    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedidoExistente) {
      return error(res, 'El pedido no existe en el sistema.', 404);
    }

    // --- ESCENARIO 4: Bloqueo de modificación por pedido en distribución ---
    // Regla: Solo se permite si el estado es REGISTRADO o ASIGNADO
    const estadosBloqueados = ['RETIRADO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO', 'CANCELADO'];
    
    if (estadosBloqueados.includes(pedidoExistente.estado)) {
      return error(
        res,
        'Operación no permitida: no se pueden modificar los datos de un pedido que ya se encuentra en camino con el transportista.',
        400
      );
    }

    // --- ESCENARIO 2: Falla por ID repetido ---
    // Verificamos si están intentando cambiar el código por uno que ya tiene otro pedido
    if (codigoSeguimiento && String(codigoSeguimiento).trim() !== pedidoExistente.codigoSeguimiento) {
      const idRepetido = await prisma.pedido.findUnique({
        where: { codigoSeguimiento: String(codigoSeguimiento).trim() },
      });

      if (idRepetido) {
        // Retornamos un 409 Conflict. El frontend deberá capturar esto y mostrar el alert de "¿desea eliminar?"
        return error(
          res,
          'El identificador del pedido ya existe. ¿Desea eliminar el pedido actual?',
          409 
        );
      }
    }

    // --- ESCENARIO 3: Falla por fecha pasada ---
    if (fechaEntrega) {
      // Normalizamos ambas fechas a formato YYYY-MM-DD para evitar problemas de horas y zonas horarias
      const fechaIngresadaStr = new Date(fechaEntrega).toISOString().split('T')[0];
      const hoyStr = new Date().toISOString().split('T')[0];

      if (fechaIngresadaStr < hoyStr) {
        // Retornamos 400. El frontend capturará este error y mostrará el mensaje emergente.
        return error(
          res,
          'La fecha de entrega ingresada es anterior a la actual. Debe cambiarla o eliminar el pedido.',
          400
        );
      }
    }

    // Preparamos el objeto con los datos a actualizar (solo agregamos los que vengan en el req.body)
    const datosActualizados = {};
    
    if (codigoSeguimiento) datosActualizados.codigoSeguimiento = String(codigoSeguimiento).trim();
    if (direccionOrigen) datosActualizados.direccionOrigen = String(direccionOrigen).trim();
    if (direccionDestino) datosActualizados.direccionDestino = String(direccionDestino).trim();
    if (destinatarioNombre) datosActualizados.destinatarioNombre = String(destinatarioNombre).trim();
    if (descripcionProductos) datosActualizados.descripcionProductos = String(descripcionProductos).trim();
    if (notas !== undefined) datosActualizados.notas = notas ? String(notas).trim() : null;
    if (fechaEntrega) datosActualizados.fechaEntrega = new Date(fechaEntrega);
    if (estado) datosActualizados.estado = estado; 

    // Regla: Debe estar asignado a una única ruta y transportista (se actualiza mediante sus IDs)
    if (rutaId) datosActualizados.rutaId = Number(rutaId);
    if (repartidorId) datosActualizados.repartidorId = Number(repartidorId);

    // --- ESCENARIO 1: Éxito (Se modifican y guardan los campos) ---
    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: datosActualizados,
      // Hacemos el include para devolver la versión completa/actualizada y mostrarla en frontend
      include: {
        repartidor: {
          select: { id: true, nombre: true, apellido: true }
        },
        ruta: {
          select: { id: true, nombre: true }
        }
      }
    });

    return success(
      res,
      {
        mensaje: 'El pedido ha sido modificado con éxito',
        pedido: pedidoActualizado,
      },
      200
    );

  } catch (err) {
    console.error('Error al modificar el pedido:', err);
    return error(res, 'Error interno del servidor al modificar el pedido.', 500);
  }
};

module.exports = {
  obtenerPedidos,
  crearPedido,
  eliminarPedido,
  modificarPedido,
};
