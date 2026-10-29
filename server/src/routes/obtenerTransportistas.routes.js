const express = require('express');
const router = express.Router();

// Importás tu controlador (el que creamos en el paso anterior)
const { obtenerTransportistas } = require('../controllers/obtenerTransportistas.controller');

// Definís que cuando llegue un GET a esta ruta, ejecute el controlador
router.get('/', obtenerTransportistas);

module.exports = router;