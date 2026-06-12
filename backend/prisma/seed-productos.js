const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está configurada.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function main() {
  const categoriaPolos = await prisma.categoria.upsert({
    where: { idCategoria: 1 },
    update: {},
    create: {
      nombre: 'Polos',
      descripcion: 'Polos de algodón personalizables',
      esActivo: true,
    },
  });

  const producto = await prisma.producto.create({
    data: {
      nombre: 'Polo Clásico Algodón',
      descripcion:
        'Polo de algodón pima peruano de alta calidad. Ideal para uso diario y personalizar con tu marca o diseño.',
      precioBase: 45.0,
      esPersonalizable: true,
      esActivo: true,
      idCategoria: categoriaPolos.idCategoria,

      variantes: {
        create: [
          {
            colorNombre: 'Blanco',
            colorHex: '#FFFFFF',
            talla: 'S',
            stock: 20,
            esActivo: true,
          },
          {
            colorNombre: 'Blanco',
            colorHex: '#FFFFFF',
            talla: 'M',
            stock: 25,
            esActivo: true,
          },
          {
            colorNombre: 'Blanco',
            colorHex: '#FFFFFF',
            talla: 'L',
            stock: 15,
            esActivo: true,
          },
          {
            colorNombre: 'Negro',
            colorHex: '#1A1A1A',
            talla: 'S',
            stock: 18,
            esActivo: true,
          },
          {
            colorNombre: 'Negro',
            colorHex: '#1A1A1A',
            talla: 'M',
            stock: 22,
            esActivo: true,
          },
          {
            colorNombre: 'Negro',
            colorHex: '#1A1A1A',
            talla: 'L',
            stock: 12,
            esActivo: true,
          },
        ],
      },

      imagenes: {
        create: [
          {
            colorHex: '#FFFFFF',
            lado: 'FRONT',
            urlImagen: '/placeholder.svg',
            displayOrder: 1,
            esActivo: true,
          },
          {
            colorHex: '#FFFFFF',
            lado: 'BACK',
            urlImagen: '/placeholder.svg',
            displayOrder: 2,
            esActivo: true,
          },
          {
            colorHex: '#1A1A1A',
            lado: 'FRONT',
            urlImagen: '/placeholder.svg',
            displayOrder: 3,
            esActivo: true,
          },
          {
            colorHex: '#1A1A1A',
            lado: 'BACK',
            urlImagen: '/placeholder.svg',
            displayOrder: 4,
            esActivo: true,
          },
        ],
      },

      descuentosVolumen: {
        create: [
          {
            cantidadMinima: 10,
            porcentajeDescuento: 5,
            esActivo: true,
          },
          {
            cantidadMinima: 25,
            porcentajeDescuento: 10,
            esActivo: true,
          },
          {
            cantidadMinima: 50,
            porcentajeDescuento: 15,
            esActivo: true,
          },
        ],
      },
    },
  });

  console.log('Producto creado:', producto.idProducto);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });