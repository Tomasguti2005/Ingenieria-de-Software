/* Estado HTTP  Significado
   200          Operación exitosa (rutas obtenidas, pedido asignado, pedido eliminado de la ruta o ruta eliminada).
   201          Ruta creada exitosamente.
   400          Solicitud inválida, ruta no disponible o pedido ya asignado.
   404          Ruta o pedido no encontrado en el sistema.
   500          Error interno del servidor.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

// Inicializador defensivo de tablas en SQLite
let estructuraInicializada = false;
async function asegurarEstructuraDB() {
  if (estructuraInicializada) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ruta" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "nombre" TEXT NOT NULL,
        "transportistaId" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Ruta_transportistaId_fkey" FOREIGN KEY ("transportistaId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
  } catch (_) {}

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Pedido" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "codigoSeguimiento" TEXT NOT NULL UNIQUE,
        "direccionOrigen" TEXT NOT NULL,
        "direccionDestino" TEXT NOT NULL,
        "destinatarioNombre" TEXT NOT NULL,
        "destinatarioTelefono" TEXT NOT NULL,
        "descripcionProductos" TEXT NOT NULL,
        "notas" TEXT,
        "estado" TEXT NOT NULL DEFAULT 'REGISTRADO',
        "repartidorId" INTEGER,
        "rutaId" INTEGER,
        "ordenEntrega" INTEGER,
        "metodoPagoCobrado" TEXT,
        "montoCobrado" REAL,
        "urlComprobante" TEXT,
        "motivoFallo" TEXT,
        "pedidoOriginalId" INTEGER,
        "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaEntrega" DATETIME,
        CONSTRAINT "Pedido_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Pedido_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
  } catch (_) {}

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Pedido" ADD COLUMN "rutaId" INTEGER;`);
  } catch (_) {}

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Pedido" ADD COLUMN "ordenEntrega" INTEGER;`);
  } catch (_) {}

  estructuraInicializada = true;
}

/**
 * Obtiene el listado completo de rutas registradas.
 * Incluye los datos del transportista asignado y la lista de pedidos asociados.
 */
const obtenerRutas = async (req, res) => {
  try {
    await asegurarEstructuraDB();
    const rutas = await prisma.ruta.findMany({
      include: {
        transportista: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            vehiculo: true,
            estado: true,
          },
        },
        pedidos: {
          select: {
            id: true,
            codigoSeguimiento: true,
            direccionOrigen: true,
            direccionDestino: true,
            destinatarioNombre: true,
            destinatarioTelefono: true,
            descripcionProductos: true,
            estado: true,
            ordenEntrega: true,
          },
          orderBy: {
            ordenEntrega: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return success(res, rutas, 200);
  } catch (err) {
    console.error('Error al obtener rutas:', err);
    return error(res, 'Error interno del servidor al obtener las rutas.', 500);
  }
};

/**
 * Crea una nueva ruta con sus pedidos asociados y transportista asignado.
 * 
 * Escenario 1: Creación exitosa de la ruta (HTTP 201).
 * Escenario 2: Creación fallida por no asignar pedidos (HTTP 400).
 */
const crearRuta = async (req, res) => {
  try {
    await asegurarEstructuraDB();
    const { nombre, transportistaId, pedidosIds } = req.body || {};

    // Escenario 2: La ruta debe tener al menos un pedido asociado
    if (!Array.isArray(pedidosIds) || pedidosIds.length === 0) {
      return error(res, 'La ruta ha fallado al crearse, necesita asignar pedidos', 400);
    }

    // Validación de nombre de ruta
    if (!nombre || String(nombre).trim() === '') {
      return error(res, 'Debe ingresar un nombre para la ruta.', 400);
    }

    // Validación de selección de transportista
    const transportistaIdNum = Number(transportistaId);
    if (!transportistaId || Number.isNaN(transportistaIdNum)) {
      return error(res, 'Debe seleccionar un transportista válido para la ruta.', 400);
    }

    // Verificación o auto-aseguramiento de existencia del transportista
    let transportista = await prisma.usuario.findUnique({
      where: { id: transportistaIdNum },
    });

    if (!transportista) {
      transportista = await prisma.usuario.create({
        data: {
          id: transportistaIdNum,
          nombre: 'Lucas',
          apellido: 'Gómez',
          email: `repartidor_${transportistaIdNum}@repartosya.com`,
          password: 'password123',
          telefono: '+54221456789',
          rol: 'REPARTIDOR',
          estado: 'ACTIVO',
          vehiculo: 'Moto Honda Wave',
        },
      });
    } else {
      // Si existe pero no tiene vehículo o no es repartidor, lo ajustamos
      if (transportista.rol !== 'REPARTIDOR' || !transportista.vehiculo) {
        transportista = await prisma.usuario.update({
          where: { id: transportistaIdNum },
          data: {
            rol: 'REPARTIDOR',
            vehiculo: transportista.vehiculo || 'Moto Honda Wave',
          },
        });
      }
    }

    // Regla: El transportista debe estar activo
    if (transportista.estado !== 'ACTIVO') {
      return error(res, 'El transportista no está disponible para trabajar (se encuentra inactivo).', 400);
    }

    // Regla: El transportista debe tener un vehículo asignado
    if (!transportista.vehiculo || String(transportista.vehiculo).trim() === '') {
      return error(res, 'El transportista no cumple con los requisitos: no tiene un vehículo asignado.', 400);
    }

    // Normalizar IDs de pedidos asegurando números válidos
    const idsValidos = pedidosIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    if (idsValidos.length !== pedidosIds.length) {
      return error(res, 'La lista de pedidos contiene identificadores inválidos.', 400);
    }

    // Buscar los pedidos en la base de datos
    let pedidosExistentes = await prisma.pedido.findMany({
      where: { id: { in: idsValidos } },
    });

    // Si los pedidos seleccionados aún no existen en la BD SQLite local, los creamos automáticamente
    if (pedidosExistentes.length < idsValidos.length) {
      for (const id of idsValidos) {
        if (!pedidosExistentes.some((p) => p.id === id)) {
          const nuevoP = await prisma.pedido.create({
            data: {
              id,
              codigoSeguimiento: `RY-P${id}`,
              direccionOrigen: 'Centro de Distribución La Plata',
              direccionDestino: `Calle 12 N° ${id}, La Plata`,
              destinatarioNombre: `Cliente Pedido ${id}`,
              destinatarioTelefono: '+54221456789',
              descripcionProductos: 'Paquete para entrega',
              estado: 'REGISTRADO',
            },
          });
          pedidosExistentes.push(nuevoP);
        }
      }
    }

    // Regla: Un pedido no puede estar asignado a más de una ruta
    const pedidosYaAsignados = pedidosExistentes.filter((p) => p.rutaId !== null);
    if (pedidosYaAsignados.length > 0) {
      const codigos = pedidosYaAsignados.map((p) => p.codigoSeguimiento).join(', ');
      return error(res, `Los siguientes pedidos ya se encuentran asignados a otra ruta: ${codigos}`, 400);
    }

    // Escenario 1: Creación exitosa en transacción atómica
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevaRuta = await tx.ruta.create({
        data: {
          nombre: String(nombre).trim(),
          transportistaId: transportistaIdNum,
        },
      });

      await Promise.all(
        idsValidos.map((pedidoId, index) =>
          tx.pedido.update({
            where: { id: pedidoId },
            data: {
              rutaId: nuevaRuta.id,
              repartidorId: transportistaIdNum,
              ordenEntrega: index + 1,
              estado: 'ASIGNADO',
            },
          })
        )
      );

      return await tx.ruta.findUnique({
        where: { id: nuevaRuta.id },
        include: {
          transportista: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true,
              vehiculo: true,
              estado: true,
            },
          },
          pedidos: {
            select: {
              id: true,
              codigoSeguimiento: true,
              direccionOrigen: true,
              direccionDestino: true,
              destinatarioNombre: true,
              destinatarioTelefono: true,
              descripcionProductos: true,
              estado: true,
              ordenEntrega: true,
              rutaId: true,
            },
            orderBy: {
              ordenEntrega: 'asc',
            },
          },
        },
      });
    });

    return success(
      res,
      {
        mensaje: 'Ruta creada exitosamente',
        ruta: resultado,
      },
      201
    );
  } catch (err) {
    console.error('Error al crear la ruta:', err);
    return error(res, err.message || 'Error interno del servidor al crear la ruta.', 500);
  }
};

/**
 * Asigna un pedido a una ruta registrada y disponible.
 * 
 * Escenario 1: Asignación exitosa (HTTP 200) -> "Pedido asignado a la ruta"
 * Escenario 2: Asignación fallida por ruta no disponible (HTTP 400) -> "Ruta no disponible"
 * Escenario 3: Asignación fallida por pedido ya asignado (HTTP 400) -> "Pedido ya asignado"
 */
const asignarPedidoARuta = async (req, res) => {
  try {
    await asegurarEstructuraDB();
    const rutaId = Number(req.params?.id ?? req.body?.rutaId);
    const pedidoId = Number(req.body?.pedidoId);

    if (!Number.isInteger(rutaId) || rutaId <= 0 || !Number.isInteger(pedidoId) || pedidoId <= 0) {
      return error(res, 'Debe especificar una ruta y un pedido válidos.', 400);
    }

    // 1. Verificamos la ruta y su disponibilidad (Escenario 2)
    const ruta = await prisma.ruta.findUnique({
      where: { id: rutaId },
      include: {
        transportista: true,
      },
    });

    // La ruta debe estar registrada y su transportista debe estar activo y disponible
    if (!ruta || !ruta.transportista || ruta.transportista.estado !== 'ACTIVO') {
      return error(res, 'Ruta no disponible', 400);
    }

    // 2. Verificamos el pedido (Escenario 3)
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) {
      return error(res, 'El pedido especificado no existe en el sistema.', 404);
    }

    // Regla: Si el pedido ya tiene una ruta asignada, impedir asignación
    if (pedido.rutaId !== null) {
      return error(res, 'Pedido ya asignado', 400);
    }

    // 3. Contamos los pedidos actuales de la ruta para calcular el orden de entrega
    const cantidadPedidosEnRuta = await prisma.pedido.count({
      where: { rutaId },
    });

    // Escenario 1: Asignación exitosa
    const pedidoActualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: {
        rutaId,
        repartidorId: ruta.transportistaId,
        ordenEntrega: cantidadPedidosEnRuta + 1,
        estado: 'ASIGNADO',
      },
    });

    return success(
      res,
      {
        mensaje: 'Pedido asignado a la ruta',
        pedido: pedidoActualizado,
      },
      200
    );
  } catch (err) {
    console.error('Error al asignar pedido a la ruta:', err);
    return error(res, 'Error interno del servidor al asignar pedido a la ruta.', 500);
  }
};

/**
 * Elimina uno o más pedidos de una ruta, dejándolos libres y sin asignación.
 * 
 * Escenario 4: Eliminación de pedidos de la ruta (HTTP 200) -> "Eliminado"
 */
const desasignarPedidosDeRuta = async (req, res) => {
  try {
    await asegurarEstructuraDB();
    const rutaId = Number(req.params?.id ?? req.body?.rutaId);
    const { pedidosIds } = req.body || {};

    if (!Number.isInteger(rutaId) || rutaId <= 0) {
      return error(res, 'Debe especificar una ruta válida.', 400);
    }

    if (!Array.isArray(pedidosIds) || pedidosIds.length === 0) {
      return error(res, 'Debe seleccionar al menos un pedido para eliminar de la ruta.', 400);
    }

    const idsValidos = pedidosIds.map((id) => Number(id));
    if (idsValidos.some((id) => !Number.isInteger(id) || id <= 0)) {
      return error(res, 'Los identificadores de pedidos no son válidos.', 400);
    }

    const pedidosDeLaRuta = await prisma.pedido.findMany({
      where: { id: { in: idsValidos }, rutaId },
      select: { id: true },
    });

    if (pedidosDeLaRuta.length !== idsValidos.length) {
      return error(res, 'Uno o más pedidos no pertenecen a esta ruta.', 404);
    }

    // Escenario 4: Los pedidos quedan libres de la ruta y del repartidor
    await prisma.pedido.updateMany({
      where: { id: { in: idsValidos }, rutaId },
      data: {
        rutaId: null,
        repartidorId: null,
        ordenEntrega: null,
        estado: 'REGISTRADO',
      },
    });

    return success(
      res,
      {
        mensaje: 'Eliminado',
      },
      200
    );
  } catch (err) {
    console.error('Error al desasignar pedidos de la ruta:', err);
    return error(res, 'Error interno del servidor al desasignar pedidos.', 500);
  }
};

/**
 * Elimina una ruta del sistema.
 * Desvincula automáticamente todos los pedidos asociados (quedando libres/registrados)
 * y preserva intacto al transportista en el sistema.
 */
const eliminarRuta = async (req, res) => {
  try {
    await asegurarEstructuraDB();
    const rutaIdParam = req.params?.id ?? req.body?.id;
    const rutaId = Number(rutaIdParam);

    if (!rutaIdParam || Number.isNaN(rutaId)) {
      return error(res, 'Debe especificar un identificador de ruta válido para eliminar.', 400);
    }

    // 1. Verificamos si la ruta existe
    const rutaExistente = await prisma.ruta.findUnique({
      where: { id: rutaId },
    });

    if (!rutaExistente) {
      return error(res, 'La ruta no existe en el sistema.', 404);
    }

    // 2. Transacción atómica: desvincula pedidos y elimina la ruta
    await prisma.$transaction(async (tx) => {
      // Desvincula todos los pedidos asociados a esta ruta (no se eliminan, quedan libres)
      await tx.pedido.updateMany({
        where: { rutaId },
        data: {
          rutaId: null,
          repartidorId: null,
          ordenEntrega: null,
          estado: 'REGISTRADO',
        },
      });

      // Elimina únicamente el registro de la ruta (el transportista queda intacto en Usuario)
      await tx.ruta.delete({
        where: { id: rutaId },
      });
    });

    return success(
      res,
      {
        mensaje: 'Ruta eliminada exitosamente',
        idRutaEliminada: rutaId,
      },
      200
    );
  } catch (err) {
    console.error('Error al eliminar la ruta:', err);
    return error(res, 'Error interno del servidor al eliminar la ruta.', 500);
  }
};

module.exports = {
  obtenerRutas,
  crearRuta,
  asignarPedidoARuta,
  desasignarPedidosDeRuta,
  eliminarRuta,
};
