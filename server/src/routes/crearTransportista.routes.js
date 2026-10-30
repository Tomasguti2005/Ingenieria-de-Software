const express = require('express');
const { crearTransportista } = require('../controllers/crearTransportista.controller.js');
const { eliminarTransportista } = require('../controllers/Eliminartransportista.controller.js');

const router = express.Router();

// Ruta POST para crear el transportista
router.post('/', crearTransportista);

// Rutas DELETE para dar de baja / eliminar el transportista
router.delete('/:id', eliminarTransportista);
router.delete('/', eliminarTransportista);

module.exports = router;
