const express = require('express');
const router = express.Router();

// Importamos todas las funciones del controlador de pedidos
// Ajusta la ruta '../controllers/pedido.controller' si tu archivo se llama distinto
const {
  obtenerPedidos,
  crearPedido,
  modificarPedido,
  eliminarPedido
} = require('../controllers/pedido.controller');

// Obtener el listado de pedidos (soporta query param ?estado=...)
router.get('/', obtenerPedidos);

// Crear un nuevo pedido
router.post('/', crearPedido);

// Modificar un pedido existente (requiere el ID en la URL, ej: /api/pedidos/5)
router.put('/:id', modificarPedido); 

// Eliminar un pedido (requiere el ID en la URL, ej: /api/pedidos/5)
router.delete('/:id', eliminarPedido);

module.exports = router;