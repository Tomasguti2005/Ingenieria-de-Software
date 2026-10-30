require('dotenv').config();
const cors = require('cors');
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const vehiculoRoutes = require('./routes/vehiculo.routes');
const transportistaVehiculoRoutes = require('./routes/transportistasVehiculo.routes');
const transportistasRoutes = require('./routes/crearTransportista.routes');
const transportistaEdicionRoutes = require('./routes/transportistas.routes');
const obtenerTransportistasRoutes = require('./routes/obtenerTransportistas.routes');
const rutaTransportistaRoutes = require('./routes/modificarTransportistaRuta.routes');
const rutasGenerales = require('./routes/rutas.routes');

const clientOrigin = process.env.ADMIN_ORIGIN || 'http://localhost:5173';

// 1. Inicializamos la aplicación de Express
const app = express();
app.use(cors({
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// 2. Middleware crucial: le dice a Express que procese y entienda el formato JSON
app.use(express.json());

// 3. Conectamos las rutas
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/transportistasVehiculo', transportistaVehiculoRoutes);
app.use('/api/admin/transportistas', transportistasRoutes);
app.use('/api/admin/transportistas', obtenerTransportistasRoutes);
app.use('/api/transportistas', transportistaEdicionRoutes);
app.use('/api/rutaTransportista', rutaTransportistaRoutes);
app.use('/api/rutas', rutasGenerales);

// 4. Definimos el puerto (usamos el del archivo .env que configuraste antes, o el 3000 por defecto)
const PORT = process.env.PORT || 3000;

// Solo iniciamos el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de Repartos Ya corriendo en http://localhost:${PORT}`);
  });
}

// Exportamos la app para que pueda ser testeada con Supertest sin levantar el servidor real
module.exports = app;
