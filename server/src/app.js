require('dotenv').config();
const express = require('express');
const cors = require('cors');
const vehiculoRoutes = require('./routes/vehiculo.routes');
const authRoutes = require('./routes/auth.routes');
const rutaTransportistaRoutes = require('./routes/modificarTransportistaRuta.routes');

const rutasGenerales = require('./routes/rutas.routes');
// 1. Inicializamos la aplicación de Express
const app = express();

// 2. CORS para permitir peticiones desde client-admin
app.use(cors({
  origin: process.env.ADMIN_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// 3. Middleware crucial: le dice a Express que procese y entienda el formato JSON
app.use(express.json());

// 4. Conectamos las rutas
app.use('/api/auth', authRoutes);
app.use('/api/vehiculos', vehiculoRoutes);

app.use('/api/rutaTransportista', rutaTransportistaRoutes);

app.use('/api/rutas', rutasGenerales);

// 4. Definimos el puerto (usamos el del archivo .env que configuraste antes, o el 3000 por defecto)
const PORT = process.env.PORT || 3000;

// 5. Encendemos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo correctamente en el puerto ${PORT}`);
});
