const express = require('express');
const router = express.Router();
const { getHistorialEntregados } = require('../controllers/getHistorialEntregados.controller');

// GET /api/pedidos/historial-entregados
// Devuelve los pedidos en estado ENTREGADO ordenados del más reciente al más antiguo
router.get('/', getHistorialEntregados);

module.exports = router;
