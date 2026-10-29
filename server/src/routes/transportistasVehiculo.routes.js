const { Router } = require('express');
const { 
  obtenerTransportistasActivos, 
  asignarVehiculoATransportista 
} = require('../controllers/transportistaVehiculo.controller.js');

const router = Router();

// GET /api/transportistas/activos
router.get('/activos', obtenerTransportistasActivos);

// POST /api/transportistas/asignar-vehiculo
router.post('/asignar-vehiculo', asignarVehiculoATransportista);

module.exports = router;