const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { pbkdf2Sync, randomBytes } = require('node:crypto');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está configurada.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

function generarHash(contrasena) {
  const iteraciones = 120000;
  const longitudLlave = 32;
  const algoritmoDigest = 'sha256';

  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(
    contrasena,
    salt,
    iteraciones,
    longitudLlave,
    algoritmoDigest,
  ).toString('hex');

  return `${iteraciones}:${salt}:${hash}`;
}

async function main() {
  const admin = await prisma.usuario.upsert({
    where: {
      email: 'admin@gamarrintintin.com',
    },
    update: {
      contrasenaHash: generarHash('Admin12345'),
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO',
      fechaEliminacion: null,
    },
    create: {
      nombres: 'Admin',
      apellidos: 'GamarrinTinTin',
      email: 'admin@gamarrintintin.com',
      contrasenaHash: generarHash('Admin12345'),
      telefono: '900000001',
      tipoDocumento: 'DNI',
      numeroDocumento: '70000001',
      direccion: 'Lima, Perú',
      rol: 'ADMINISTRADOR',
      estado: 'ACTIVO',
    },
  });

  const vendedor = await prisma.usuario.upsert({
    where: {
      email: 'vendedor@gamarrintintin.com',
    },
    update: {
      contrasenaHash: generarHash('Vendedor12345'),
      rol: 'VENDEDOR',
      estado: 'ACTIVO',
      fechaEliminacion: null,
    },
    create: {
      nombres: 'Vendedor',
      apellidos: 'GamarrinTinTin',
      email: 'vendedor@gamarrintintin.com',
      contrasenaHash: generarHash('Vendedor12345'),
      telefono: '900000002',
      tipoDocumento: 'DNI',
      numeroDocumento: '70000002',
      direccion: 'Lima, Perú',
      rol: 'VENDEDOR',
      estado: 'ACTIVO',
    },
  });

  console.log('Usuarios de prueba creados:');
  console.log({
    admin: {
      idUsuario: admin.idUsuario,
      email: admin.email,
      password: 'Admin12345',
      rol: admin.rol,
    },
    vendedor: {
      idUsuario: vendedor.idUsuario,
      email: vendedor.email,
      password: 'Vendedor12345',
      rol: vendedor.rol,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });