const express = require('express');
const { editarEstadoOperativo } = require('../controllers/editarEstadoOperativo.controller.js');

const router = express.Router();

// Rutas para editar el estado operativo del transportista (Activo / Inactivo)
router.patch('/:id/estado', editarEstadoOperativo);
router.put('/:id/estado', editarEstadoOperativo);
router.post('/:id/estado', editarEstadoOperativo);
router.patch('/:id', editarEstadoOperativo);
router.patch('/', editarEstadoOperativo);
router.put('/', editarEstadoOperativo);

module.exports = router;
