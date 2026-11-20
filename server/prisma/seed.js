// seed.js — Crea o actualiza la cuenta del administrador, repartidor, vehículo, ruta y pedidos iniciales.
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

  // Vehículo con formato de patente estándar (AB123CD)
  const patenteSeed = 'AB123CD';
  await prisma.vehiculo.upsert({
    where: { patente: patenteSeed },
    update: { modelo: 'Renault Kangoo' },
    create: {
      patente: patenteSeed,
      modelo: 'Renault Kangoo',
    },
  });

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
      vehiculo: patenteSeed,
    },
    create: {
      email: repartidorEmail,
      password: repartidorPasswordHash,
      nombre: 'Carlos',
      apellido: 'Gómez',
      telefono: '+5492211234567',
      rol: 'REPARTIDOR',
      estado: 'ACTIVO',
      vehiculo: patenteSeed,
    },
  });

  console.log(`✅ Repartidor creado/actualizado: ${repartidor.email} (id: ${repartidor.id}, vehículo: ${patenteSeed})`);

  // Ruta del día asignada al repartidor del seed (para probar bloqueo de estado con pedidos retirados)
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date(hoyInicio);
  hoyFin.setDate(hoyFin.getDate() + 1);

  let rutaSeed = await prisma.ruta.findFirst({
    where: {
      nombre: 'Ruta Centro - La Plata',
      transportistaId: repartidor.id,
      createdAt: { gte: hoyInicio, lt: hoyFin },
    },
  });

  if (!rutaSeed) {
    rutaSeed = await prisma.ruta.create({
      data: {
        nombre: 'Ruta Centro - La Plata',
        transportistaId: repartidor.id,
      },
    });
  }

  console.log(`✅ Ruta creada/encontrada: ${rutaSeed.nombre} (id: ${rutaSeed.id})`);

  // 5 pedidos libres (REGISTRADO) + 1 pedido FALLIDO + 2 pedidos RETIRADOS/EN_CAMINO en la ruta del seed
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
    {
      codigoSeguimiento: 'RY-FA01',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Calle 12 N° 950, La Plata',
      destinatarioNombre: 'Martín Herrera',
      destinatarioTelefono: '+5492214455667',
      descripcionProductos: 'Caja de repuestos electrónicos',
      notas: 'Timbre 2B',
      motivoFallo: 'Domicilio cerrado al momento de la entrega',
      estado: 'FALLIDO',
    },
    {
      codigoSeguimiento: 'RY-RT01',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Calle 8 N° 640, La Plata',
      destinatarioNombre: 'Federico Álvarez',
      destinatarioTelefono: '+5492219988776',
      descripcionProductos: 'Auriculares inalámbricos',
      notas: 'Piso 4 Depto B',
      estado: 'EN_CAMINO',
      repartidorId: repartidor.id,
      rutaId: rutaSeed.id,
      ordenEntrega: 1,
    },
    {
      codigoSeguimiento: 'RY-RT02',
      direccionOrigen: 'Av. 7 N° 850, La Plata',
      direccionDestino: 'Calle 47 N° 510, La Plata',
      destinatarioNombre: 'Valentina Ríos',
      destinatarioTelefono: '+5492213322110',
      descripcionProductos: 'Libros universitarios',
      notas: 'Entregar en mesa de entradas',
      estado: 'RETIRADO',
      repartidorId: repartidor.id,
      rutaId: rutaSeed.id,
      ordenEntrega: 2,
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
        motivoFallo: pedido.motivoFallo ?? null,
        estado: pedido.estado,
        repartidorId: pedido.repartidorId ?? null,
        rutaId: pedido.rutaId ?? null,
        ordenEntrega: pedido.ordenEntrega ?? null,
      },
      create: pedido,
    });
    console.log(`📦 Pedido creado/actualizado: ${p.codigoSeguimiento} - ${p.destinatarioNombre} (${p.estado})`);
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
