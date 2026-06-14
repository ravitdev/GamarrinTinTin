import 'dotenv/config';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no esta configurada.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PASSWORD = '12345678';

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

async function upsertUsuario({
  email,
  nombres,
  apellidos,
  telefono,
  tipoDocumento,
  numeroDocumento,
  direccion,
  rol,
}) {
  return prisma.usuario.upsert({
    where: { email },
    update: {
      nombres,
      apellidos,
      telefono,
      tipoDocumento,
      numeroDocumento,
      direccion,
      rol,
      estado: 'ACTIVO',
      fechaEliminacion: null,
    },
    create: {
      nombres,
      apellidos,
      email,
      contrasenaHash: generarHash(PASSWORD),
      telefono,
      tipoDocumento,
      numeroDocumento,
      direccion,
      rol,
      estado: 'ACTIVO',
    },
  });
}

async function upsertCategoria(nombre, descripcion) {
  return prisma.categoria.upsert({
    where: { nombre },
    update: {
      descripcion,
      esActivo: true,
      fechaEliminacion: null,
    },
    create: {
      nombre,
      descripcion,
    },
  });
}

async function obtenerOCrearProducto({
  categoria,
  nombre,
  descripcion,
  precioBase,
  esPersonalizable,
  esActivo = true,
  variantes,
  imagenes,
  descuentosVolumen = [],
}) {
  const existente = await prisma.producto.findFirst({
    where: { nombre },
    include: { variantes: true, imagenes: true, descuentosVolumen: true },
  });

  if (existente) {
    return prisma.producto.update({
      where: { idProducto: existente.idProducto },
      data: {
        idCategoria: categoria.idCategoria,
        descripcion,
        precioBase,
        esPersonalizable,
        esActivo,
        fechaEliminacion: esActivo ? null : new Date(),
      },
      include: { variantes: true, imagenes: true, descuentosVolumen: true },
    });
  }

  return prisma.producto.create({
    data: {
      idCategoria: categoria.idCategoria,
      nombre,
      descripcion,
      precioBase,
      esPersonalizable,
      esActivo,
      fechaEliminacion: esActivo ? null : new Date(),
      variantes: { create: variantes },
      imagenes: { create: imagenes },
      descuentosVolumen: { create: descuentosVolumen },
    },
    include: { variantes: true, imagenes: true, descuentosVolumen: true },
  });
}

function subtotalItem(variante, cantidad) {
  return Number(variante.producto.precioBase) * cantidad;
}

async function crearPedido({ cliente, estado, items, diasAtras }) {
  const detalles = items.map(({ variante, cantidad }) => ({
    idProductoVariante: variante.idProductoVariante,
    cantidad,
    precioUnitario: Number(variante.producto.precioBase),
    subtotal: subtotalItem(variante, cantidad),
    nombreProductoSnapshot: variante.producto.nombre,
    colorSnapshot: variante.colorNombre,
    tallaSnapshot: variante.talla,
  }));

  const subtotal = detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  const descuentoTotal = subtotal >= 180 ? 15 : 0;
  const total = subtotal - descuentoTotal;
  const fechaCreacion = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

  const pedido = await prisma.pedido.create({
    data: {
      idCliente: cliente.idUsuario,
      estado,
      subtotal,
      descuentoTotal,
      total,
      direccionSnapshot: cliente.direccion,
      fechaCreacion,
      detalles: {
        create: detalles,
      },
    },
  });

  if (estado !== 'REGISTRADO' && estado !== 'CANCELADO') {
    await prisma.pago.create({
      data: {
        idPedido: pedido.idPedido,
        monto: total,
        metodoPago: 'TARJETA',
        estado: 'PAGADO',
        referenciaExterna: `seed-${pedido.idPedido}`,
        fechaPago: fechaCreacion,
        gatewayResponse: {
          origen: 'seed',
          mensaje: 'Pago de prueba aprobado',
        },
      },
    });
  }

  return pedido;
}

async function main() {
  const admin = await upsertUsuario({
    email: 'admin@gamarrintintin.com',
    nombres: 'Administrador',
    apellidos: 'Principal',
    telefono: '987654321',
    tipoDocumento: 'DNI',
    numeroDocumento: '70000001',
    direccion: 'Av. Gamarra 100, La Victoria',
    rol: 'ADMINISTRADOR',
  });

  const vendedor = await upsertUsuario({
    email: 'vendedor@gamarrintintin.com',
    nombres: 'Valeria',
    apellidos: 'Vendedora',
    telefono: '987654322',
    tipoDocumento: 'DNI',
    numeroDocumento: '70000002',
    direccion: 'Jr. Italia 210, La Victoria',
    rol: 'VENDEDOR',
  });

  const cliente = await upsertUsuario({
    email: 'cliente@gamarrintintin.com',
    nombres: 'Carlos',
    apellidos: 'Cliente',
    telefono: '987654323',
    tipoDocumento: 'DNI',
    numeroDocumento: '70000003',
    direccion: 'Av. Canada 1234, San Borja',
    rol: 'CLIENTE',
  });

  const polos = await upsertCategoria('Polos', 'Polos personalizables y basicos.');
  const poleras = await upsertCategoria('Poleras', 'Poleras urbanas y de temporada.');
  const casacas = await upsertCategoria('Casacas', 'Casacas y prendas exteriores.');

  const producto1 = await obtenerOCrearProducto({
    categoria: polos,
    nombre: 'Polo Premium Personalizable',
    descripcion: 'Polo de algodon para estampado personalizado.',
    precioBase: 39.9,
    esPersonalizable: true,
    variantes: [
      { colorNombre: 'Blanco', colorHex: '#FFFFFF', talla: 'S', stock: 30 },
      { colorNombre: 'Blanco', colorHex: '#FFFFFF', talla: 'M', stock: 40 },
      { colorNombre: 'Negro', colorHex: '#111111', talla: 'M', stock: 35 },
      { colorNombre: 'Negro', colorHex: '#111111', talla: 'L', stock: 25 },
    ],
    imagenes: [
      { colorHex: '#FFFFFF', lado: 'FRONT', urlImagen: '/placeholder.svg', displayOrder: 0 },
      { colorHex: '#111111', lado: 'FRONT', urlImagen: '/placeholder.svg', displayOrder: 1 },
    ],
    descuentosVolumen: [
      { cantidadMinima: 6, porcentajeDescuento: 5 },
      { cantidadMinima: 12, porcentajeDescuento: 10 },
    ],
  });

  const producto2 = await obtenerOCrearProducto({
    categoria: poleras,
    nombre: 'Polera Urbana Oversize',
    descripcion: 'Polera gruesa con corte oversize.',
    precioBase: 89.9,
    esPersonalizable: false,
    variantes: [
      { colorNombre: 'Gris', colorHex: '#808080', talla: 'M', stock: 20 },
      { colorNombre: 'Gris', colorHex: '#808080', talla: 'L', stock: 18 },
      { colorNombre: 'Azul Marino', colorHex: '#1E3A5F', talla: 'XL', stock: 12 },
    ],
    imagenes: [
      { colorHex: '#808080', lado: 'FRONT', urlImagen: '/placeholder.svg', displayOrder: 0 },
      { colorHex: '#1E3A5F', lado: 'FRONT', urlImagen: '/placeholder.svg', displayOrder: 1 },
    ],
    descuentosVolumen: [
      { cantidadMinima: 4, porcentajeDescuento: 7 },
    ],
  });

  const producto3 = await obtenerOCrearProducto({
    categoria: casacas,
    nombre: 'Casaca Denim Clasica',
    descripcion: 'Casaca denim resistente para uso diario.',
    precioBase: 129.9,
    esPersonalizable: true,
    variantes: [
      { colorNombre: 'Denim', colorHex: '#34568B', talla: 'M', stock: 10 },
      { colorNombre: 'Denim', colorHex: '#34568B', talla: 'L', stock: 8 },
    ],
    imagenes: [
      { colorHex: '#34568B', lado: 'FRONT', urlImagen: '/placeholder.svg', displayOrder: 0 },
    ],
  });

  await obtenerOCrearProducto({
    categoria: polos,
    nombre: 'Polo Temporada Pasada',
    descripcion: 'Producto de prueba inactivo para administracion.',
    precioBase: 29.9,
    esPersonalizable: false,
    esActivo: false,
    variantes: [
      { colorNombre: 'Rojo', colorHex: '#CC3333', talla: 'S', stock: 5 },
    ],
    imagenes: [
      { colorHex: '#CC3333', lado: 'FRONT', urlImagen: '/placeholder.svg', displayOrder: 0 },
    ],
  });

  const variantes = await prisma.productoVariante.findMany({
    where: {
      idProducto: {
        in: [producto1.idProducto, producto2.idProducto, producto3.idProducto],
      },
      esActivo: true,
    },
    include: { producto: true },
    orderBy: { idProductoVariante: 'asc' },
  });

  await prisma.carrito.upsert({
    where: { idUsuario: cliente.idUsuario },
    update: {},
    create: {
      idUsuario: cliente.idUsuario,
      items: {
        create: [
          {
            tipoItem: 'PRODUCTO',
            idProductoVariante: variantes[0].idProductoVariante,
            cantidad: 2,
          },
          {
            tipoItem: 'PRODUCTO',
            idProductoVariante: variantes[3].idProductoVariante,
            cantidad: 1,
          },
        ],
      },
    },
  });

  const pedidosExistentes = await prisma.pedido.findMany({
    where: { idCliente: cliente.idUsuario },
    select: { idPedido: true },
  });
  const idsPedidos = pedidosExistentes.map((pedido) => pedido.idPedido);

  if (idsPedidos.length > 0) {
    await prisma.pago.deleteMany({ where: { idPedido: { in: idsPedidos } } });
    await prisma.pedidoDetalle.deleteMany({ where: { idPedido: { in: idsPedidos } } });
    await prisma.pedido.deleteMany({ where: { idPedido: { in: idsPedidos } } });
  }

  await crearPedido({
    cliente,
    estado: 'REGISTRADO',
    diasAtras: 1,
    items: [
      { variante: variantes[0], cantidad: 2 },
      { variante: variantes[1], cantidad: 1 },
    ],
  });

  await crearPedido({
    cliente,
    estado: 'CONFIRMADO',
    diasAtras: 3,
    items: [
      { variante: variantes[2], cantidad: 1 },
      { variante: variantes[4], cantidad: 1 },
    ],
  });

  await crearPedido({
    cliente,
    estado: 'PROCESANDO',
    diasAtras: 5,
    items: [
      { variante: variantes[5], cantidad: 2 },
    ],
  });

  await crearPedido({
    cliente,
    estado: 'ENVIADO',
    diasAtras: 8,
    items: [
      { variante: variantes[6], cantidad: 1 },
    ],
  });

  await crearPedido({
    cliente,
    estado: 'ENTREGADO',
    diasAtras: 14,
    items: [
      { variante: variantes[0], cantidad: 4 },
      { variante: variantes[3], cantidad: 2 },
    ],
  });

  console.log('Seed completado.');
  console.log(`Admin: ${admin.email} / ${PASSWORD}`);
  console.log(`Vendedor: ${vendedor.email} / ${PASSWORD}`);
  console.log(`Cliente: ${cliente.email} / ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
