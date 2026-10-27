// auth.routes.js — Rutas de autenticación.
// POST /api/auth/admin/login  → Solo acepta rol ADMIN
// POST /api/auth/mobile/login → Solo acepta rol REPARTIDOR + estado ACTIVO

const express = require('express');
const router = express.Router();
const authController = require('../controllers/InicioSesion.controller');

router.post('/admin/login', (req, res) => authController.loginAdmin(req, res));
router.post('/mobile/login', (req, res) => authController.loginRepartidor(req, res));

module.exports = router;
