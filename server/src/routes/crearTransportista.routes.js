const express = require('express');
const { crearTransportista } = require('../controllers/crearTransportista.controller.js'); // Ajustá el '../' según dónde guardes este archivo

const router = express.Router();

// Ruta POST para crear el transportista
router.post('/', crearTransportista);

module.exports = router;