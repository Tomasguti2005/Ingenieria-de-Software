const express = require('express');
const { getRendicion } = require('../controllers/rendicion.controller');

const router = express.Router();

// GET /api/admin/rendicion?modo=diaria&fecha=YYYY-MM-DD
// GET /api/admin/rendicion?modo=mensual&mes=YYYY-MM
router.get('/', getRendicion);

module.exports = router;
