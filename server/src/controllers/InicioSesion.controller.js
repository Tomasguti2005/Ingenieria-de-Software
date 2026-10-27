/* Estado HTTP  Significado
   200          Inicio de sesión exitoso.
   400          La solicitud está incompleta o es inválida.
   401          Las credenciales no son válidas.
   423          La cuenta está bloqueada temporalmente tras reiterados intentos fallidos.
   500          Ocurrió un error interno del servidor.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

const intentosFallidos = new Map();
const TIEMPO_BLOQUEO_MS = 30; // 30 segundos de bloqueo
const MAX_INTENTOS = 3;

/**
 * Controlador de inicio de sesión adaptado al proyecto Repartos Ya.
 * Espera req.body con { email, password }.
 * Modelo Prisma: Usuario { id, nombre, apellido, email, password, rol, estado, ... }
 */
const iniciarSesion = async (req, res) => {
  const { email, password } = req.body || {};

  // Validación de campos obligatorios
  if (!email || !password) {
    return error(res, 'Debe ingresar un email y una contraseña.', 400);
  }

  const claveEmail = String(email).trim().toLowerCase();
  const ahora = Date.now();
  const registro = intentosFallidos.get(claveEmail);

  // Verificación de bloqueo temporal
  if (registro && registro.bloqueadoHasta > ahora) {
    return error(res, 'Cuenta bloqueada momentáneamente tras reiterados intentos fallidos.', 423);
  }

  if (registro?.bloqueadoHasta && registro.bloqueadoHasta <= ahora) {
    intentosFallidos.delete(claveEmail);
  }

  try {
    // Búsqueda del usuario por email único en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { email: claveEmail },
    });

    // Validación de usuario y contraseña
    // Nota: Por el momento se compara contra texto plano según la base de datos inicial/seed.
    // Al incorporar bcrypt, aquí se cambiará por await bcrypt.compare(password, usuario.password)
    if (!usuario || usuario.password !== password) {
      const intentos = (intentosFallidos.get(claveEmail)?.intentos || 0) + 1;

      if (intentos >= MAX_INTENTOS) {
        intentosFallidos.set(claveEmail, {
          intentos,
          bloqueadoHasta: ahora + TIEMPO_BLOQUEO_MS,
        });

        return error(res, 'Cuenta bloqueada momentáneamente tras 3 intentos fallidos.', 423);
      }

      intentosFallidos.set(claveEmail, { intentos });

      // Mensajes específicos que el front-end reconoce para marcar el input exacto
      const mensaje = usuario ? 'contraseña incorrecta' : 'id invalido';
      return error(res, mensaje, 401);
    }

    // Si el usuario es repartidor y se encuentra inactivo, no debe poder iniciar sesión
    if (usuario.rol === 'REPARTIDOR' && usuario.estado !== 'ACTIVO') {
      return error(res, 'El usuario repartidor se encuentra inactivo.', 403);
    }

    // Limpieza de intentos fallidos al tener éxito
    intentosFallidos.delete(claveEmail);

    // Datos del usuario que necesita el frontend
    const datosUsuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };

    // Formato compatible con el frontend (retornando datos del usuario y estructura estándar)
    return success(
      res,
      {
        mensaje: 'Inicio de sesión exitoso.',
        usuario: datosUsuario,
        token: `jwt-token-${usuario.id}-${Date.now()}`, // Placeholder listo para sustituir por token JWT firmado
      },
      200
    );
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    return error(res, 'Error interno al iniciar sesión.', 500);
  }
};

module.exports = iniciarSesion;

