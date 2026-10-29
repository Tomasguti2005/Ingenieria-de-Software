const { Router } = require('express');
const { getTransportista } = require('../controllers/getTransportista.controller.js');
const { modificarTransportista } = require('../controllers/ModificarTransportista.controller.js');

const router = Router();

// Traer un transportista por id (GET /api/transportistas/:id)
router.get('/:id', getTransportista);

// Modificar un transportista (POST /api/transportistas/:id)
router.post('/:id', modificarTransportista);

module.exports = router;