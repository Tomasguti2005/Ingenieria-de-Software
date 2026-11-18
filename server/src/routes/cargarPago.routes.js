const express = require('express');
const router = express.Router();
const { uploadComprobante } = require('../middlewares/uploadComprobante.middleware');
const { cargarPago } = require('../controllers/cargarPago.controller');

// PATCH /api/pedidos/:id/cargar-pago
// Acepta multipart/form-data (archivo de comprobante + metodoPagoCobrado/metodoPago)
// o JSON ({ urlComprobante, metodoPagoCobrado, montoCobrado? })
router.patch('/:id/cargar-pago', uploadComprobante, cargarPago);

module.exports = router;
