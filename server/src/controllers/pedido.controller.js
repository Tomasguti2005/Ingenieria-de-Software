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
        descripcionProductos: String(descripcionProductos).trim(),
        notas: notas ? String(notas).trim() : null,
        montoCobrado: montoCobrado ? Number(montoCobrado) : null,
        estado: 'REGISTRADO',
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

module.exports = {
  obtenerPedidos,
  crearPedido,
  eliminarPedido,
};
