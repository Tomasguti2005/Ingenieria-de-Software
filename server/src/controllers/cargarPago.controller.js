const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'MERCADO_PAGO', 'OTRO'];

/**
 * Permite al repartidor cargar el comprobante de pago y seleccionar el método de pago
 * de un pedido para confirmar que se realizó la transacción.
 */
const cargarPago = async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return error(res, 'ID de pedido inválido.', 400);
    }

    const archivoSubido = req.file || (Array.isArray(req.files) ? req.files[0] : null);
    const rawUrlComprobante = req.body?.urlComprobante ?? req.body?.comprobante;

    let urlComprobante = null;
    if (archivoSubido) {
      urlComprobante = `/uploads/comprobantes/${archivoSubido.filename}`;
    } else if (typeof rawUrlComprobante === 'string' && rawUrlComprobante.trim().length > 0) {
      urlComprobante = rawUrlComprobante.trim();
    }

    if (!urlComprobante) {
      return error(res, 'no se cargo el comprobante de pago', 400);
    }

    const rawMetodoPago = req.body?.metodoPagoCobrado ?? req.body?.metodoPago;

    if (typeof rawMetodoPago !== 'string' || rawMetodoPago.trim().length === 0) {
      return error(res, 'no se seleccionó ningun método de pago', 400);
    }

    const metodoPagoNormalizado = rawMetodoPago.trim().toUpperCase();
    if (!METODOS_PAGO_VALIDOS.includes(metodoPagoNormalizado)) {
      return error(
        res,
        `Método de pago inválido. Valores permitidos: ${METODOS_PAGO_VALIDOS.join(', ')}.`,
        400
      );
    }

    const rawMonto = req.body?.montoCobrado ?? req.body?.monto;
    if (rawMonto === undefined || rawMonto === null || String(rawMonto).trim() === '') {
      return error(res, 'no se ingresó el monto cobrado', 400);
    }

    const montoCobrado = Number(rawMonto);
    if (!Number.isFinite(montoCobrado) || montoCobrado < 0) {
      return error(res, 'El monto cobrado debe ser un número válido mayor o igual a 0.', 400);
    }

    const pedidoExistente = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { id: true },
    });

    if (!pedidoExistente) {
      return error(res, 'El pedido no existe en el sistema.', 404);
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        urlComprobante,
        metodoPagoCobrado: metodoPagoNormalizado,
        montoCobrado,
      },
    });

    return success(
      res,
      {
        mensaje: 'pago realizadó',
        pedido: pedidoActualizado,
      },
      200
    );
  } catch (err) {
    console.error('Error al cargar el pago del pedido:', err);
    return error(res, 'Error interno del servidor al cargar el pago.', 500);
  }
};

module.exports = {
  cargarPago,
};
