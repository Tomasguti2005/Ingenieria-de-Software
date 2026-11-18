const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { error } = require('../utils/response');

async function autenticarRepartidor(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return error(res, 'Debe iniciar sesión como repartidor para continuar.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secreto_largo_y_aleatorio'
    );
  } catch {
    return error(res, 'La sesión es inválida o ha expirado.', 401);
  }

  const usuarioId = Number(payload.id);
  if (!Number.isInteger(usuarioId) || payload.rol !== 'REPARTIDOR') {
    return error(res, 'Esta operación solo está disponible para repartidores.', 403);
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, rol: true, estado: true },
    });

    if (!usuario || usuario.rol !== 'REPARTIDOR') {
      return error(res, 'La cuenta de repartidor no existe.', 401);
    }

    if (usuario.estado !== 'ACTIVO') {
      return error(res, 'El usuario repartidor se encuentra inactivo.', 403);
    }

    req.usuario = { id: usuario.id };
    return next();
  } catch (err) {
    console.error('Error al validar la sesión móvil:', err);
    return error(res, 'Error interno al validar la sesión.', 500);
  }
}

module.exports = autenticarRepartidor;
