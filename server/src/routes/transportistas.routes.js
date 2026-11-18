const { Router } = require('express');
const { getTransportista } = require('../controllers/getTransportista.controller.js');
const { modificarTransportista } = require('../controllers/ModificarTransportista.controller.js');
const { cambiarEstadoTransportista } = require('../controllers/cambiarEstadoTransportista.controller.js');

const router = Router();

// Traer un transportista por id (GET /api/transportistas/:id)
router.get('/:id', getTransportista);

// Modificar un transportista (POST /api/transportistas/:id)
router.post('/:id', modificarTransportista);

// Cambiar estado operativo de un transportista (PATCH /api/transportistas/:id/estado)
router.patch('/:id/estado', cambiarEstadoTransportista);

module.exports = router;