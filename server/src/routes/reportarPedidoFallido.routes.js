const express = require('express');
const router = express.Router();
const { reportarPedidoFallido } = require('../controllers/reportarPedidoFallido.controller');

// PATCH /api/pedidos/:id/reportar-fallido
// Espera en el body: { "motivoFallo": "..." } (o { "motivo": "..." })
router.patch('/:id/reportar-fallido', reportarPedidoFallido);

module.exports = router;
