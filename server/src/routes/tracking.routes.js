// tracking.routes.js — Ruta pública de seguimiento de pedidos.
// GET /api/tracking/:codigo → Devuelve datos acotados para el cliente final (sin autenticación).

const { Router } = require('express');
const prisma = require('../config/prisma');

const router = Router();

router.get('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!codigo || typeof codigo !== 'string' || !codigo.trim()) {
      return res.status(400).json({
        error: 'El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible',
      });
    }

    const codigoLimpio = codigo.trim();
    console.log(`📡 [BACKEND TRACKING] Consulta recibida para el código: "${codigoLimpio}"`);

    // Buscamos el pedido real en la base de datos por su código único de seguimiento
    const pedido = await prisma.pedido.findFirst({
      where: {
        codigoSeguimiento: {
          equals: codigoLimpio,
        },
      },
      include: {
        repartidor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            vehiculo: true,
          },
        },
        ruta: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!pedido) {
      console.log(`⚠️ [BACKEND TRACKING] Código "${codigoLimpio}" no existe en la base de datos (404).`);
      return res.status(404).json({
        error: 'El enlace de seguimiento no es válido o el pedido ya no se encuentra disponible',
      });
    }

    console.log(`✅ [BACKEND TRACKING] Pedido encontrado: ID #${pedido.id} - Destinatario: ${pedido.destinatarioNombre} - Estado: ${pedido.estado}`);

    // Devolvemos la información real del pedido (destinatario, dirección, productos, transportista)
    const datosCliente = {
      id: pedido.id,
      codigoSeguimiento: pedido.codigoSeguimiento,
      estado: pedido.estado,
      direccionOrigen: pedido.direccionOrigen,
      direccionDestino: pedido.direccionDestino,
      destinatarioNombre: pedido.destinatarioNombre,
      destinatarioTelefono: pedido.destinatarioTelefono,
      descripcionProductos: pedido.descripcionProductos,
      diaEntrega: pedido.fechaEntrega ? pedido.fechaEntrega.toISOString().split('T')[0] : '',
      fechaEntrega: pedido.fechaEntrega,
      transportista: pedido.repartidor
        ? {
            nombre: `${pedido.repartidor.nombre || ''} ${pedido.repartidor.apellido || ''}`.trim(),
            telefono: pedido.repartidor.telefono || null,
            vehiculo: pedido.repartidor.vehiculo || 'Vehículo autorizado de flota Repartos Ya',
          }
        : null,
      repartidor: pedido.repartidor
        ? {
            id: pedido.repartidor.id,
            nombre: pedido.repartidor.nombre,
            apellido: pedido.repartidor.apellido,
            telefono: pedido.repartidor.telefono || null,
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      data: datosCliente,
    });
  } catch (err) {
    console.error('Error al consultar seguimiento de pedido:', err);
    return res.status(500).json({
      error: 'Error interno del servidor al consultar el pedido.',
    });
  }
});

module.exports = router;
