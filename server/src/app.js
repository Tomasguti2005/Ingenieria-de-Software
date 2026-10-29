require('dotenv').config();
const cors = require('cors');
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const vehiculoRoutes = require('./routes/vehiculo.routes');
const transportistaVehiculoRoutes = require('./routes/transportistasVehiculo.routes');
const transportistasRoutes = require('./routes/crearTransportista.routes');
const transportistaEdicionRoutes = require('./routes/transportistas.routes');

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
app.use('/api/transportistas', transportistaEdicionRoutes);



// 4. Definimos el puerto (usamos el del archivo .env que configuraste antes, o el 3000 por defecto)
const PORT = process.env.PORT || 3000;

// 5. Encendemos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo correctamente en el puerto ${PORT}`);
});
