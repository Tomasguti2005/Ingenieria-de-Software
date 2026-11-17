const express = require('express');
const router = express.Router();
const { obtenerCodigoSeguimiento } = require('../controllers/seguimientoPedido.controller');

// GET /api/pedidos/:id/seguimiento
router.get('/:id/seguimiento', obtenerCodigoSeguimiento);

module.exports = router;
