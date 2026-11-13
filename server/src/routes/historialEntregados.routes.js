const express = require('express');
const getHistorialEntregados = require('../controllers/getHistorialEntregados.controller');

const router = express.Router();

router.get('/', getHistorialEntregados);

module.exports = router;