const express = require('express');
const router = express.Router();
const { asignarTransportistaARuta, removerTransportistaDeRuta } = require('../controllers/asignacionRutas.controller');

// POST: Asigna o modifica un transportista en una ruta específica
// Espera en el body: { "transportistaId": 5, "forzarModificacion": false/true }
router.post('/:id/asignar-transportista', asignarTransportistaARuta);

// DELETE: Remueve el transportista de la ruta (lo deja en null)
router.delete('/:id/remover-transportista', removerTransportistaDeRuta);

module.exports = router;