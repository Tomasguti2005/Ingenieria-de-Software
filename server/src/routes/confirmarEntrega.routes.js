const express = require('express');
const router = express.Router();
const { confirmarEntrega } = require('../controllers/confirmarEntrega.controller');

// PATCH /api/pedidos/:id/confirmar-entrega
router.patch('/:id/confirmar-entrega', confirmarEntrega);

module.exports = router;
