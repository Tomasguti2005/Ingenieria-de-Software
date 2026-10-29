require('dotenv').config();
const express = require('express');
const cors = require('cors');

const vehiculoRoutes = require('./routes/vehiculo.routes');
// 1. IMPORTAR LA NUEVA RUTA DE TRANSPORTISTAS:
const transportistasRoutes = require('./routes/crearTransportista.routes.js'); 

// 1. Inicializamos la aplicación de Express
const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

// 2. Middleware crucial: le dice a Express que procese y entienda el formato JSON
app.use(express.json());

// 3. Conectamos tus rutas de vehículos
app.use('/api/vehiculos', vehiculoRoutes);

// 4. CONECTAMOS LA RUTA DE TRANSPORTISTAS:
// Usamos el prefijo '/api/admin/transportistas' para que coincida con tu frontend
app.use('/api/admin/transportistas', transportistasRoutes);

// 5. Definimos el puerto (usamos el del archivo .env que configuraste antes, o el 3000 por defecto)
const PORT = process.env.PORT || 3000;

// 6. Encendemos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo correctamente en el puerto ${PORT}`);
});