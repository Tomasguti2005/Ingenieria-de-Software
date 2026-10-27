/* Estado HTTP  Significado
   200          Los datos del transportista han sido actualizados con éxito.
   400          Debe completar todos los campos obligatorios con un formato válido.
   404          El transportista no existe o no corresponde a un repartidor.
   409          El correo electrónico ya se encuentra registrado.
   500          Error interno del servidor al actualizar los datos.
*/

const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

// Expresión regular para validar formato nombre@gmail.com
const REGEX_EMAIL_GMAIL = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

// Expresión regular para teléfono: todo seguido sin espacios (admite código de país opcional + seguido de dígitos)
const REGEX_TELEFONO_SIN_ESPACIOS = /^\+?[0-9]{7,15}$/;

/**
 * Controlador para modificar los datos de un transportista.
 * 
 * Escenario 1: Modificación exitosa (HTTP 200).
 * Escenario 2: Formato de datos inválidos o campos obligatorios vacíos (HTTP 400).
 * Escenario 3: Modificación rechazada por correo duplicado (HTTP 409).
 */
const modificarTransportista = async (req, res) => {
  // El ID puede venir por parámetro de ruta (/api/admin/transportistas/:id) o en el cuerpo de la petición
  const idParam = req.params?.id ?? req.body?.id;
  const transportistaId = Number(idParam);

  if (!idParam || Number.isNaN(transportistaId)) {
    return error(res, 'Debe especificar un transportista válido para modificar.', 400);
  }

  const { nombre, apellido, email, telefono, vehiculo, estado } = req.body || {};

  // Escenario 2: Verificación de que todos los campos obligatorios estén presentes y no vacíos
  const camposRequeridos = [nombre, apellido, email, telefono, vehiculo, estado];
  const tieneCamposVacios = camposRequeridos.some(
    (campo) => campo === undefined || campo === null || String(campo).trim() === ''
  );

  if (tieneCamposVacios) {
    return error(res, 'Debe completar todos los campos obligatorios con un formato válido', 400);
  }

  const nombreLimpio = String(nombre).trim();
  const apellidoLimpio = String(apellido).trim();
  const emailLimpio = String(email).trim().toLowerCase();
  const telefonoLimpio = String(telefono).trim();
  const vehiculoLimpio = String(vehiculo).trim();
  const estadoLimpio = String(estado).trim().toUpperCase();

  // Escenario 2: Validación de formato de email (debe ser @gmail.com)
  if (!REGEX_EMAIL_GMAIL.test(emailLimpio)) {
    return error(res, 'Debe completar todos los campos obligatorios con un formato válido', 400);
  }

  // Escenario 2: Validación de formato de teléfono (todo seguido sin espacios)
  if (telefonoLimpio.includes(' ') || !REGEX_TELEFONO_SIN_ESPACIOS.test(telefonoLimpio)) {
    return error(res, 'Debe completar todos los campos obligatorios con un formato válido', 400);
  }

  // Validación de enumerativo de estado del repartidor (ACTIVO / INACTIVO)
  if (!['ACTIVO', 'INACTIVO'].includes(estadoLimpio)) {
    return error(res, 'Debe completar todos los campos obligatorios con un formato válido', 400);
  }

  try {
    // Verificamos si el transportista a editar existe en el sistema
    const transportistaActual = await prisma.usuario.findUnique({
      where: { id: transportistaId },
    });

    if (!transportistaActual || transportistaActual.rol !== 'REPARTIDOR') {
      return error(res, 'El transportista no existe o no corresponde a un repartidor.', 404);
    }

    // Escenario 3: Control de correo duplicado si se intenta cambiar a uno perteneciente a otro usuario
    if (emailLimpio !== transportistaActual.email.toLowerCase()) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { email: emailLimpio },
      });

      if (emailExistente && emailExistente.id !== transportistaId) {
        return error(res, 'El correo electrónico ya se encuentra registrado', 409);
      }
    }

    // Escenario 1: Actualización exitosa en la base de datos
    const transportistaActualizado = await prisma.usuario.update({
      where: { id: transportistaId },
      data: {
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        email: emailLimpio,
        telefono: telefonoLimpio,
        vehiculo: vehiculoLimpio,
        estado: estadoLimpio,
      },
    });

    // Retorna mensaje y listado/objeto con los datos principales requeridos:
    // nombre, contacto (teléfono), apellido y estado actual
    return success(
      res,
      {
        mensaje: 'Los datos del transportista han sido actualizados con éxito',
        transportista: {
          id: transportistaActualizado.id,
          nombre: transportistaActualizado.nombre,
          apellido: transportistaActualizado.apellido,
          contacto: transportistaActualizado.telefono,
          telefono: transportistaActualizado.telefono,
          email: transportistaActualizado.email,
          estado: transportistaActualizado.estado,
          vehiculo: transportistaActualizado.vehiculo,
        },
      },
      200
    );
  } catch (err) {
    console.error('Error al actualizar datos del transportista:', err);
    return error(res, 'Error interno del servidor al actualizar los datos.', 500);
  }
};

module.exports = {
  modificarTransportista,
};

