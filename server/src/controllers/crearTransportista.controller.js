const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const crearTransportista = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, password } = req.body;

    // Regla: Los campos obligatorios a completar son: Nombre, Apellido, Correo electrónico, Contraseña y Teléfono.
    if (!nombre || !apellido || !email || !telefono || !password) {
      return res.status(400).json({ 
        error: 'Todos los campos obligatorios deben estar completos.' 
      });
    }

    // Escenario 3: Registro rechazado por contraseña débil
    // Mínimo 8 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'La contraseña no cumple con los estándares de seguridad requeridos' 
      });
    }

    const emailNormalizado = email.toLowerCase().trim();

    // Escenario 2: Registro rechazado por mail duplicado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado }
    });

    if (usuarioExistente) {
      return res.status(409).json({ 
        error: 'Operación no permitida: el correo electrónico ya pertenece a otro usuario registrado' 
      });
    }

    // Escenario 1: Alta de cuenta exitosa
    // Encriptar la contraseña (salting rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoTransportista = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailNormalizado,
        telefono: telefono.trim(),
        vehiculo: null,
        password: hashedPassword,
        rol: 'REPARTIDOR',
        estado: 'ACTIVO'
      }
    });

    // Omitimos la contraseña en la respuesta por seguridad
    const { password: _, ...datosTransportista } = nuevoTransportista;

    return res.status(201).json({
      mensaje: 'El usuario transportista ha sido creado con éxito',
      data: datosTransportista
    });

  } catch (error) {
    console.error('Error al crear transportista:', error);
    return res.status(500).json({ 
      error: 'Hubo un error interno en el servidor' 
    });
  }
};

module.exports = { crearTransportista };
