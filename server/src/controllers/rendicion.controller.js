const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const MODOS_VALIDOS = ['diaria', 'mensual'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function obtenerRangoDiario(fechaStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    return null;
  }
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const inicio = new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  if (
    inicio.getFullYear() !== anio ||
    inicio.getMonth() !== mes - 1 ||
    inicio.getDate() !== dia
  ) {
    return null;
  }
  const fin = new Date(anio, mes - 1, dia + 1, 0, 0, 0, 0);
  return { inicio, fin };
}

function obtenerRangoMensual(mesStr) {
  if (!/^\d{4}-\d{2}$/.test(mesStr)) {
    return null;
  }
  const [anio, mes] = mesStr.split('-').map(Number);
  if (mes < 1 || mes > 12) {
    return null;
  }
  const inicio = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
  const fin = new Date(anio, mes, 1, 0, 0, 0, 0);
  return { inicio, fin };
}

/**
 * Obtiene el reporte de rendición de cuentas diario o mensual por transportista.
 * Ruta: GET /api/admin/rendicion?modo=diaria&fecha=YYYY-MM-DD
 *       GET /api/admin/rendicion?modo=mensual&mes=YYYY-MM
 */
const getRendicion = async (req, res) => {
  try {
    const modo = String(req.query.modo || 'diaria').toLowerCase();
    if (!MODOS_VALIDOS.includes(modo)) {
      return error(res, 'Modo inválido. Valores permitidos: diaria, mensual.', 400);
    }

    const ahora = new Date();
    let periodo;
    let rango;

    if (modo === 'diaria') {
      periodo =
        req.query.fecha ||
        `${ahora.getFullYear()}-${pad2(ahora.getMonth() + 1)}-${pad2(ahora.getDate())}`;
      rango = obtenerRangoDiario(periodo);
      if (!rango) {
        return error(res, 'Formato de fecha inválido. Use YYYY-MM-DD.', 400);
      }
    } else {
      periodo = req.query.mes || `${ahora.getFullYear()}-${pad2(ahora.getMonth() + 1)}`;
      rango = obtenerRangoMensual(periodo);
      if (!rango) {
        return error(res, 'Formato de mes inválido. Use YYYY-MM.', 400);
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        estado: 'ENTREGADO',
        repartidorId: { not: null },
        fechaEntrega: {
          gte: rango.inicio,
          lt: rango.fin,
        },
      },
      select: {
        id: true,
        montoCobrado: true,
        repartidor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    const agrupadoPorTransportista = new Map();

    for (const pedido of pedidos) {
      if (!pedido.repartidor) continue;

      const { id, nombre, apellido } = pedido.repartidor;
      const montoPedido = Number(pedido.montoCobrado) || 0;

      if (!agrupadoPorTransportista.has(id)) {
        agrupadoPorTransportista.set(id, {
          id,
          nombre,
          apellido,
          entregas: 0,
          monto: 0,
        });
      }

      const registro = agrupadoPorTransportista.get(id);
      registro.entregas += 1;
      registro.monto += montoPedido;
    }

    const items = Array.from(agrupadoPorTransportista.values()).sort(
      (a, b) => b.monto - a.monto || a.apellido.localeCompare(b.apellido)
    );

    const totalGeneral = items.reduce((acc, item) => acc + item.monto, 0);
    const totalEntregas = items.reduce((acc, item) => acc + item.entregas, 0);
    const cantidadTransportistas = items.length;
    const promedioPorTransportista =
      cantidadTransportistas > 0 ? totalGeneral / cantidadTransportistas : 0;

    return success(res, {
      modo,
      periodo,
      items,
      resumen: {
        totalGeneral,
        totalEntregas,
        cantidadTransportistas,
        promedioPorTransportista,
      },
    });
  } catch (err) {
    console.error('Error al obtener la rendición de cuentas:', err);
    return error(res, 'Error interno del servidor al obtener la rendición de cuentas.', 500);
  }
};

module.exports = {
  getRendicion,
};
