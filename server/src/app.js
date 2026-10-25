const express = require('express');
const vehiculoRoutes = require('./routes/vehiculo.routes');

// 1. Inicializamos la aplicación de Express
const app = express();

// 2. Middleware crucial: le dice a Express que procese y entienda el formato JSON
app.use(express.json());

// 3. Conectamos tus rutas de vehículos
app.use('/api/vehiculos', vehiculoRoutes);

// 4. Definimos el puerto (usamos el del archivo .env que configuraste antes, o el 3000 por defecto)
const PORT = process.env.PORT || 3000;

// 5. Encendemos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo correctamente en el puerto ${PORT}`);
});