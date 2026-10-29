const express = require('express');
const router = express.Router();

// Importamos las funciones del controlador
// Asegurate de que la ruta al archivo del controlador sea la correcta
const {
  obtenerRutas,
  crearRuta,
  asignarPedidoARuta,
  desasignarPedidosDeRuta,
  eliminarRuta
} = require('../controllers/ruta.controller'); // Ajustá el nombre si tu archivo se llama distinto

// GET: Obtener todas las rutas
router.get('/', obtenerRutas);

// POST: Crear una nueva ruta
router.post('/', crearRuta);

// POST: Asignar un pedido a una ruta específica
router.post('/:id/asignar-pedido', asignarPedidoARuta);

// DELETE: Desasignar pedidos de una ruta específica
// Usa DELETE porque remueve la relación, aunque recibe un body con pedidosIds
router.delete('/:id/desasignar-pedidos', desasignarPedidosDeRuta);

// DELETE: Eliminar una ruta completa
router.delete('/:id', eliminarRuta);

module.exports = router;