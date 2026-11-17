const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { error } = require('../utils/response');

const uploadsDir = path.join(__dirname, '../../uploads/comprobantes');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `comprobante-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Formato de comprobante inválido. Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.'));
    }
    return cb(null, true);
  },
}).any();

/**
 * Middleware para procesar la subida opcional de un archivo de comprobante (multipart/form-data).
 * Si la petición es JSON, continúa sin alterar req.body.
 */
const uploadComprobante = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return error(res, err.message || 'Error al procesar el archivo de comprobante.', 400);
    }
    return next();
  });
};

module.exports = {
  uploadComprobante,
};
