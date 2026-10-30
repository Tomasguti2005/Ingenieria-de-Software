// seed.js — Crea o actualiza la cuenta del administrador, repartidores y pedidos iniciales.
// Se ejecuta con: npx prisma db seed o node prisma/seed.js
// Lee las credenciales de las variables de entorno (.env)

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NOMBRE,
    ADMIN_APELLIDO,
    ADMIN_TELEFONO,
  } = process.env;

  // Validar que todas las variables estén definidas
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NOMBRE || !ADMIN_APELLIDO || !ADMIN_TELEFONO) {
    throw new Error(
      'Faltan variables de entorno para el seed del admin. ' +
      'Revisá tu archivo server/.env (ver .env.example)'
    );
  }

  const emailNormalizado = ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: emailNormalizado },
    update: {
      nombre: ADMIN_NOMBRE,
      apellido: ADMIN_APELLIDO,
      telefono: ADMIN_TELEFONO,
      password: passwordHash,
    },
    create: {
      email: emailNormalizado,
      password: passwordHash,
      nombre: ADMIN_NOMBRE,
      apellido: ADMIN_APELLIDO,
      telefono: ADMIN_TELEFONO,
      rol: 'ADMIN',
      estado: 'ACTIVO',
    },
  });

  console.log(`✅ Admin creado/actualizado: ${admin.email} (id: ${admin.id})`);

  // Repartidor inicial para pruebas en client-mobile
  const repartidorEmail = 'repartidor@repartosya.com';
  const repartidorPasswordHash = await bcrypt.hash('repartidor123', 10);

  const repartidor = await prisma.usuario.upsert({
    where: { email: repartidorEmail },
    update: {
      nombre: 'Carlos',
      apellido: 'Gómez',
      telefono: '+5492211234567',
      password: repartidorPasswordHash,
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
      vehiculo: 'Moto Honda Wave',
    },
    create: {
      email: repartidorEmail,
      password: repartidorPasswordHash,
      nombre: 'Carlos',
      apellido: 'Gómez',
      telefono: '+5492211234567',
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
      vehiculo: 'Moto Honda Wave',
    },
  });

  console.log(`✅ Repartidor creado/actualizado: ${repartidor.email} (id: ${repartidor.id})`);

  // Pedidos iniciales para pruebas del sistema y asignación de rutas
  const pedidosIniciales = [
    {
      codigoSeguimiento: 'RY-LP01',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Calle 12 N° 450, La Plata',
      destinatarioNombre: 'María López',
      destinatarioTelefono: '+5492214455667',
      descripcionProductos: 'Caja de herramientas y repuestos',
      notas: 'Dejar en recepción o portería',
      estado: 'REGISTRADO',
    },
    {
      codigoSeguimiento: 'RY-LP02',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Calle 50 N° 780, La Plata',
      destinatarioNombre: 'Gonzalo Méndez',
      destinatarioTelefono: '+5492215566778',
      descripcionProductos: 'Set de bazar y vajilla térmica',
      notas: 'Timbre 3A, entregar por la mañana',
      estado: 'REGISTRADO',
    },
    {
      codigoSeguimiento: 'RY-LP03',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Diagonal 74 N° 1200, La Plata',
      destinatarioNombre: 'Luciana Torres',
      destinatarioTelefono: '+5492216677889',
      descripcionProductos: 'Zapatillas deportivas talle 38',
      notas: 'Llamar antes de llegar',
      estado: 'REGISTRADO',
    },
    {
      codigoSeguimiento: 'RY-BS01',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Av. Montevideo N° 1420, Berisso',
      destinatarioNombre: 'Esteban Morales',
      destinatarioTelefono: '+5492213344556',
      descripcionProductos: 'Insumos de computación y periféricos',
      notas: 'Portón verde sobre avenida',
      estado: 'REGISTRADO',
    },
    {
      codigoSeguimiento: 'RY-EN01',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Calle La Merced N° 230, Ensenada',
      destinatarioNombre: 'Camila Duarte',
      destinatarioTelefono: '+5492218899001',
      descripcionProductos: 'Lote de librería escolar y artística',
      notas: 'Horario comercial 9 a 18 hs',
      estado: 'REGISTRADO',
    },
  ];

  for (const pedido of pedidosIniciales) {
    const p = await prisma.pedido.upsert({
      where: { codigoSeguimiento: pedido.codigoSeguimiento },
      update: {
        direccionOrigen: pedido.direccionOrigen,
        direccionDestino: pedido.direccionDestino,
        destinatarioNombre: pedido.destinatarioNombre,
        destinatarioTelefono: pedido.destinatarioTelefono,
        descripcionProductos: pedido.descripcionProductos,
        notas: pedido.notas,
        estado: pedido.estado,
      },
      create: pedido,
    });
    console.log(`📦 Pedido creado/actualizado: ${p.codigoSeguimiento} - ${p.destinatarioNombre} (id: ${p.id})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
