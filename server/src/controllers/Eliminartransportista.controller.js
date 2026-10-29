/* Estado HTTP  Significado
   200          Transportista eliminado exitosamente.
   400          No se ha seleccionado un transportista o solicitud incompleta.
   404          El transportista seleccionado no existe o no corresponde a un repartidor.
   500          Error interno del servidor al eliminar (se registra en la carpeta de errores).
*/

const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { success, error } = require('../utils/response');

// Ruta a la carpeta de errores del sistema
const CARPETA_ERRORES = path.join(__dirname, '..', '..', 'logs', 'errors');

/**
 * Registra los detalles del error en la carpeta de errores del sistema.
 * @param {Error|object} err - Objeto de error capturado.
 * @param {object} contexto - Datos de contexto (id solicitado, timestamp, etc.).
 */
const registrarErrorEnArchivo = (err, contexto = {}) => {
  try {
    if (!fs.existsSync(CARPETA_ERRORES)) {
      fs.mkdirSync(CARPETA_ERRORES, { recursive: true });
    }

    const fecha = new Date();
    const nombreArchivo = `error_${fecha.toISOString().slice(0, 10)}.log`;
    const rutaArchivo = path.join(CARPETA_ERRORES, nombreArchivo);

    const entradaLog = `[${fecha.toISOString()}] ERROR AL ELIMINAR TRANSPORTISTA
Contexto: ${JSON.stringify(contexto)}
Mensaje: ${err.message || err}
Stack: ${err.stack || 'Sin stack trace'}
--------------------------------------------------------------------------------\n`;

    fs.appendFileSync(rutaArchivo, entradaLog, 'utf8');
  } catch (logErr) {
    console.error('No se pudo guardar el error en el archivo de log:', logErr);
  }
};

/**
 * Controlador para eliminar un transportista seleccionado.
 * 
 * Escenario 1: Se elimina al transportista de forma correcta (HTTP 200).
 * Escenario 2: No se ha seleccionado al transportista en la solicitud (HTTP 400).
 * Escenario 3: Ocurre un error al eliminar; se informa el error y se persiste en la carpeta de errores (HTTP 500).
 */
const eliminarTransportista = async (req, res) => {
  // El front-end puede enviar el identificador por params (DELETE /:id) o en el body (DELETE / con { id })
  const idSeleccionado = req.params?.id ?? req.body?.id;

  // Escenario 2: No se ha seleccionado al repartidor / transportista
  if (idSeleccionado === undefined || idSeleccionado === null || String(idSeleccionado).trim() === '') {
    return error(res, 'Debe seleccionar un transportista para confirmar la eliminación.', 400);
  }

  const idNumero = Number(idSeleccionado);
  if (Number.isNaN(idNumero)) {
    return error(res, 'El transportista seleccionado tiene un identificador inválido.', 400);
  }

  try {
    // Verificamos si el transportista existe en la base de datos
    const transportista = await prisma.usuario.findUnique({
      where: { id: idNumero },
    });

    if (!transportista || transportista.rol !== 'REPARTIDOR') {
      return error(res, 'El transportista seleccionado no existe o no corresponde a un repartidor.', 404);
    }

    // Escenario 1: Eliminación exitosa de la base de datos
    const transportistaEliminado = await prisma.usuario.delete({
      where: { id: idNumero },
    });

    return success(
      res,
      {
        mensaje: 'Transportista eliminado correctamente.',
        transportista: {
          id: transportistaEliminado.id,
          nombre: transportistaEliminado.nombre,
          apellido: transportistaEliminado.apellido,
          email: transportistaEliminado.email,
        },
      },
      200
    );
  } catch (err) {
    // Escenario 3: Error al eliminar (se notifica y se guarda en la carpeta de errores del sistema)
    registrarErrorEnArchivo(err, { idSeleccionado: idNumero, body: req.body, params: req.params });
    console.error('Error al eliminar transportista:', err);

    return error(
      res,
      'Ocurrió un error al intentar eliminar el transportista. El incidente fue registrado en el sistema.',
      500
    );
  }
};

module.exports = {
  eliminarTransportista,
};

