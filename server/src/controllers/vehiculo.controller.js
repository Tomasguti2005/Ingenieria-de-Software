const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los vehículos (para el select del frontend)
const obtenerVehiculos = async (req, res) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany();
    return res.status(200).json({ success: true, data: vehiculos });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener vehículos.' });
  }
};

const registrarVehiculo = async (req, res) => {
  try {
    
    const { patente, modelo } = req.body;

    if (!patente || !modelo) {
      return res.status(400).json({ error: 'La patente y el modelo son obligatorios' });
    }

    // Patente duplicada ; findUnique revisa si un vehiculo en la base de datos coincide con la patente ingresada
    const vehiculoExistente = await prisma.vehiculo.findUnique({
      where: { patente: patente.toUpperCase() }
    });

    if (vehiculoExistente) {
      return res.status(401).json({ 
        error: 'La patente ingresada ya se encuentra registrada en el sistema' 
      });
    }

    // Acepta formato nuevo (AB123CD) o formato viejo (ABC123)
    const regexPatente = /^([a-zA-Z]{2}\d{3}[a-zA-Z]{2}|[a-zA-Z]{3}\d{3})$/;

    if (!regexPatente.test(patente)) {
      return res.status(400).json({ 
        error: 'El formato de la patente es inválido. Debe ser del tipo AB123CD o ABC123.' 
      });
    }

    // Registro exitoso
    const nuevoVehiculo = await prisma.vehiculo.create({
      data: {
        patente: patente.toUpperCase() ,
        modelo
      }
    });

    return res.status(201).json({
      mensaje: 'Vehículo registrado correctamente',
      vehiculo: nuevoVehiculo
    });

  } catch (error) {
    console.error('Error al registrar vehículo:', error);
    return res.status(500).json({ error });
  }
};

module.exports = {
  registrarVehiculo,
  obtenerVehiculos
};