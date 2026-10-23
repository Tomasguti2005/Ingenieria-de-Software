/**
 * response.js — Formato uniforme de respuestas API.
 * Todas las respuestas siguen: { success: boolean, data?: any, error?: string }
 */

/**
 * Respuesta exitosa.
 * @param {object} res - Express response
 * @param {any} data - Datos a enviar
 * @param {number} statusCode - Código HTTP (default 200)
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/**
 * Respuesta de error.
 * @param {object} res - Express response
 * @param {string} error - Mensaje de error
 * @param {number} statusCode - Código HTTP (default 400)
 */
function error(res, error, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error });
}

module.exports = { success, error };
