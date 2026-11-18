const express = require('express');
const router = express.Router();
// Controladores de rutas y pedidos
const {
  obtenerRutas,
  crearRuta,
  asignarPedidoARuta,
  desasignarPedidosDeRuta,
  eliminarRuta,
  reordenarPedidosDeRuta
} = require('../controllers/ruta.controller');

// Controladores de asignación de transportista a ruta
const {
  asignarTransportistaARuta,
  removerTransportistaDeRuta
} = require('../controllers/asignacionRutas.controller');

// GET: Obtener todas las rutas
router.get('/', obtenerRutas);

// POST: Crear una nueva ruta
router.post('/', crearRuta);

// POST: Asignar un pedido a una ruta específica
router.post('/:id/asignar-pedido', asignarPedidoARuta);

// DELETE: Desasignar pedidos de una ruta específica
router.delete('/:id/desasignar-pedidos', desasignarPedidosDeRuta);

// PUT: Reordenar los pedidos de una ruta específica
router.put('/:id/reordenar-pedidos', reordenarPedidosDeRuta);

// POST: Asignar o modificar el transportista de una ruta
router.post('/:id/asignar-transportista', asignarTransportistaARuta);

// DELETE: Remover el transportista de la ruta
router.delete('/:id/remover-transportista', removerTransportistaDeRuta);

// DELETE: Eliminar una ruta completa
router.delete('/:id', eliminarRuta);

module.exports = router;
