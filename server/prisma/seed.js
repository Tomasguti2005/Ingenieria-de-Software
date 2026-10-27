// seed.js — Crea o actualiza la cuenta del administrador.
// Se ejecuta con: npx prisma db seed
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
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
