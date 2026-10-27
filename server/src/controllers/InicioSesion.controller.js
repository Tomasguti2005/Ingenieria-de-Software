/* Estado HTTP  Significado
   200          Inicio de sesión exitoso.
   400          La solicitud está incompleta o es inválida.
   401          Las credenciales no son válidas.
   423          La cuenta está bloqueada temporalmente tras reiterados intentos fallidos.
   500          Ocurrió un error interno del servidor.
*/

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const intentosFallidos = new Map();
const TIEMPO_BLOQUEO_MS = 30 * 1000; // 30 segundos de bloqueo
const MAX_INTENTOS = 3;

/**
 * Lógica de inicio de sesión que valida credenciales, roles y bloqueos.
 */
const procesarInicioSesion = async (req, res, rolEsperado) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return error(res, 'Debe ingresar un email y una contraseña.', 400);
  }

  const claveEmail = String(email).trim().toLowerCase();
  const ahora = Date.now();
  const registro = intentosFallidos.get(claveEmail);

  if (registro && registro.bloqueadoHasta > ahora) {
    return error(res, 'Cuenta bloqueada momentáneamente tras reiterados intentos fallidos.', 423);
  }

  if (registro?.bloqueadoHasta && registro.bloqueadoHasta <= ahora) {
    intentosFallidos.delete(claveEmail);
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email: claveEmail },
    });

    const registrarIntentoFallido = (mensajeError) => {
      const intentos = (intentosFallidos.get(claveEmail)?.intentos || 0) + 1;

      if (intentos >= MAX_INTENTOS) {
        intentosFallidos.set(claveEmail, {
          intentos,
          bloqueadoHasta: ahora + TIEMPO_BLOQUEO_MS,
        });
        return error(res, 'Cuenta bloqueada momentáneamente tras 3 intentos fallidos.', 423);
      }

      intentosFallidos.set(claveEmail, { intentos });
      return error(res, mensajeError, 401);
    };

    if (!usuario) {
      return registrarIntentoFallido('id invalido');
    }

    if (usuario.rol !== rolEsperado) {
      return registrarIntentoFallido('id invalido');
    }

    let passwordValida = false;
    try {
      passwordValida = await bcrypt.compare(password, usuario.password);
    } catch {
      passwordValida = false;
    }

    if (!passwordValida && usuario.password === password) {
      passwordValida = true;
    }

    if (!passwordValida) {
      return registrarIntentoFallido('contraseña incorrecta');
    }

    if (usuario.rol === 'REPARTIDOR' && usuario.estado !== 'ACTIVO') {
      return error(res, 'El usuario repartidor se encuentra inactivo.', 403);
    }

    intentosFallidos.delete(claveEmail);

    const datosUsuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };

    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
        email: usuario.email,
      },
      process.env.JWT_SECRET || 'secreto_largo_y_aleatorio',
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    return success(
      res,
      {
        mensaje: 'Inicio de sesión exitoso.',
        usuario: datosUsuario,
        token,
      },
      200
    );
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    return error(res, 'Error interno al iniciar sesión.', 500);
  }
};

const loginAdmin = async (req, res) => {
  return procesarInicioSesion(req, res, 'ADMIN');
};

const loginRepartidor = async (req, res) => {
  return procesarInicioSesion(req, res, 'REPARTIDOR');
};

module.exports = {
  loginAdmin,
  loginRepartidor,
};
