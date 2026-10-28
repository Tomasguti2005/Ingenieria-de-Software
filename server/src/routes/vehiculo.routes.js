const { Router } = require('express');
const { registrarVehiculo, obtenerVehiculos } = require('../controllers/vehiculo.controller.js');

const router = Router();

// Endpoint para el select del frontend (GET /api/vehiculos)
router.get('/', obtenerVehiculos);

// Endpoint para registrar vehículos (POST /api/vehiculos/registrar)
router.post('/registrar', registrarVehiculo);

module.exports = router;