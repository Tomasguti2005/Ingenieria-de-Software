const express = require('express');
const router = express.Router(); // 1. Creamos una sección para agrupar rutas
const { registrarVehiculo } = require('../controllers/vehiculo.controller');

// 2. Definimos la puerta exacta y quién atiende
router.post('/registrar', registrarVehiculo);

module.exports = router;