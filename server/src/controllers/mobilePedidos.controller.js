const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const estadosActivos = ['ASIGNADO', 'RETIRADO', 'EN_CAMINO'];
const MENSAJE_RUTA_INICIADA =
  'No es posible modificar el estado de retiro: la ruta de reparto ya se encuentra iniciada';

function obtenerRangoDelDia() {
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);

  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + 1);

  return { gte: desde, lt: hasta };
}

const pedidoMovilSelect = {
  id: true,
  codigoSeguimiento: true,
  direccionOrigen: true,
  direccionDestino: true,
  destinatarioNombre: true,
  destinatarioTelefono: true,
  descripcionProductos: true,
  estado: true,
  ordenEntrega: true,
  ruta: {
    select: {
      id: true,
      nombre: true,
    },
  },
};

function adaptarPedidoMovil(pedido) {
  const { ruta, ...datosPedido } = pedido;
  return {
    ...datosPedido,
    rutaId: ruta.id,
    rutaNombre: ruta.nombre,
  };
}

const obtenerPedidosAsignados = async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: {
        repartidorId: req.usuario.id,
        estado: { in: estadosActivos },
        ruta: {
          is: {
            transportistaId: req.usuario.id,
            createdAt: obtenerRangoDelDia(),
          },
        },
      },
      select: pedidoMovilSelect,
      orderBy: [
        { rutaId: 'asc' },
        { ordenEntrega: 'asc' },
        { id: 'asc' },
      ],
    });

    return success(res, pedidos.map(adaptarPedidoMovil), 200);
  } catch (err) {
    console.error('Error al obtener pedidos del repartidor:', err);
    return error(res, 'Error interno al obtener los pedidos asignados.', 500);
  }
};

const actualizarRetiroPedido = async (req, res) => {
  const pedidoId = Number(req.params.id);
  const { retirado } = req.body || {};

  if (!Number.isInteger(pedidoId) || pedidoId < 1 || typeof retirado !== 'boolean') {
    return error(res, 'Debe indicar un pedido válido y si fue retirado.', 400);
  }

  try {
    const pedido = await prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        repartidorId: req.usuario.id,
        ruta: {
          is: {
            transportistaId: req.usuario.id,
            createdAt: obtenerRangoDelDia(),
          },
        },
      },
      select: pedidoMovilSelect,
    });

    if (!pedido) {
      return error(res, 'El pedido no está asignado a este repartidor para el día de hoy.', 404);
    }

    if (!retirado) {
      const rutaIniciada = await prisma.pedido.findFirst({
        where: {
          rutaId: pedido.ruta.id,
          repartidorId: req.usuario.id,
          estado: 'EN_CAMINO',
        },
        select: { id: true },
      });

      if (rutaIniciada) {
        return error(res, MENSAJE_RUTA_INICIADA, 409);
      }

      if (pedido.estado === 'RETIRADO') {
        return error(res, 'Un pedido retirado no puede desmarcarse.', 409);
      }
    }

    const estadoEsperado = retirado ? 'ASIGNADO' : 'RETIRADO';
    const nuevoEstado = retirado ? 'RETIRADO' : 'ASIGNADO';

    if (pedido.estado === nuevoEstado) {
      return success(res, adaptarPedidoMovil(pedido), 200);
    }

    if (pedido.estado !== estadoEsperado) {
      return error(res, 'No se puede modificar el retiro en el estado actual del pedido.', 409);
    }

    const resultado = await prisma.pedido.updateMany({
      where: {
        id: pedidoId,
        repartidorId: req.usuario.id,
        rutaId: pedido.ruta.id,
        estado: estadoEsperado,
      },
      data: { estado: nuevoEstado },
    });

    if (resultado.count !== 1) {
      return error(res, 'El estado del pedido cambió. Actualizá la lista e intentá nuevamente.', 409);
    }

    const pedidoActualizado = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: pedidoMovilSelect,
    });

    return success(res, adaptarPedidoMovil(pedidoActualizado), 200);
  } catch (err) {
    console.error('Error al actualizar el retiro del pedido:', err);
    return error(res, 'Error interno al actualizar el retiro del pedido.', 500);
  }
};

module.exports = {
  obtenerPedidosAsignados,
  actualizarRetiroPedido,
};
