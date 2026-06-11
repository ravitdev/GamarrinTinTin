import { Producto } from './domain/producto.entity';
import { RegistrarProductoDto } from './dto/registrar-producto.dto';
import { ModificarProductoDto } from './dto/modificar-producto.dto';
import { ProductoManager } from './producto.manager';
import { ProductoRepository } from './producto.repository';

class ProductoRepositoryFake {
  private productos: Producto[] = [
    new Producto(
      1,
      1,
      'Polo básico',
      'Polo de algodón para uso diario',
      35,
      true,
      true,
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-01T00:00:00.000Z'),
      {
        idCategoria: 1,
        nombre: 'Polos',
      },
      [
        {
          idProductoVariante: 1,
          idProducto: 1,
          colorNombre: 'Negro',
          colorHex: '#000000',
          talla: 'M',
          stock: 10,
          esActivo: true,
        },
        {
          idProductoVariante: 2,
          idProducto: 1,
          colorNombre: 'Negro',
          colorHex: '#000000',
          talla: 'L',
          stock: 5,
          esActivo: true,
        },
      ],
      [
        {
          idProductoImagen: 1,
          idProducto: 1,
          colorHex: '#000000',
          lado: 'FRONT',
          urlImagen: 'https://example.com/polo-negro-front.png',
          displayOrder: 0,
          esActivo: true,
        },
      ],
      [
        {
          idDescuentoVolumen: 1,
          idProducto: 1,
          cantidadMinima: 10,
          porcentajeDescuento: 5,
          esActivo: true,
        },
      ],
    ),
    new Producto(
      2,
      1,
      'Polo eliminado',
      'Producto no visible en catálogo',
      40,
      false,
      false,
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-01T00:00:00.000Z'),
      {
        idCategoria: 1,
        nombre: 'Polos',
      },
      [],
      [],
      [],
    ),
  ];

  async listarCatalogo(): Promise<Producto[]> {
    return this.productos.filter((producto) => producto.esActivo);
  }

  async buscarDetallePorId(idProducto: number): Promise<Producto | null> {
    return (
      this.productos.find(
        (producto) => producto.idProducto === idProducto && producto.esActivo,
      ) ?? null
    );
  }

  async registrar(datos: RegistrarProductoDto): Promise<Producto> {
    const idProducto =
      Math.max(...this.productos.map((producto) => producto.idProducto)) + 1;

    const fechaActual = new Date('2026-06-02T00:00:00.000Z');

    const producto = new Producto(
      idProducto,
      datos.idCategoria,
      datos.nombre,
      datos.descripcion,
      datos.precioBase,
      datos.esPersonalizable,
      true,
      fechaActual,
      fechaActual,
      {
        idCategoria: datos.idCategoria,
        nombre: 'Categoría demo',
      },
      datos.variantes.map((variante, index) => ({
        idProductoVariante: index + 100,
        idProducto,
        colorNombre: variante.colorNombre,
        colorHex: variante.colorHex,
        talla: variante.talla,
        stock: variante.stock,
        esActivo: true,
      })),
      datos.imagenes.map((imagen, index) => ({
        idProductoImagen: index + 100,
        idProducto,
        colorHex: imagen.colorHex,
        lado: imagen.lado,
        urlImagen: imagen.urlImagen,
        displayOrder: imagen.displayOrder ?? 0,
        esActivo: true,
      })),
      (datos.descuentosVolumen ?? []).map((descuento, index) => ({
        idDescuentoVolumen: index + 100,
        idProducto,
        cantidadMinima: descuento.cantidadMinima,
        porcentajeDescuento: descuento.porcentajeDescuento,
        esActivo: true,
      })),
    );

    this.productos.push(producto);

    return producto;
  }

  async modificar(
    idProducto: number,
    datos: ModificarProductoDto,
  ): Promise<Producto> {
    const producto = await this.buscarDetallePorId(idProducto);

    if (!producto) {
      throw new Error('Producto no encontrado.');
    }

    const productoActualizado = new Producto(
      producto.idProducto,
      datos.idCategoria ?? producto.idCategoria,
      datos.nombre ?? producto.nombre,
      datos.descripcion ?? producto.descripcion,
      datos.precioBase ?? producto.precioBase,
      datos.esPersonalizable ?? producto.esPersonalizable,
      producto.esActivo,
      producto.fechaCreacion,
      new Date('2026-06-03T00:00:00.000Z'),
      producto.categoria,
      datos.variantes
        ? datos.variantes.map((variante, index) => ({
            idProductoVariante: index + 200,
            idProducto,
            colorNombre: variante.colorNombre,
            colorHex: variante.colorHex,
            talla: variante.talla,
            stock: variante.stock,
            esActivo: true,
          }))
        : producto.variantes,
      datos.imagenes
        ? datos.imagenes.map((imagen, index) => ({
            idProductoImagen: index + 200,
            idProducto,
            colorHex: imagen.colorHex,
            lado: imagen.lado,
            urlImagen: imagen.urlImagen,
            displayOrder: imagen.displayOrder ?? 0,
            esActivo: true,
          }))
        : producto.imagenes,
      datos.descuentosVolumen
        ? datos.descuentosVolumen.map((descuento, index) => ({
            idDescuentoVolumen: index + 200,
            idProducto,
            cantidadMinima: descuento.cantidadMinima,
            porcentajeDescuento: descuento.porcentajeDescuento,
            esActivo: true,
          }))
        : producto.descuentosVolumen,
    );

    const index = this.productos.findIndex(
      (productoActual) => productoActual.idProducto === idProducto,
    );

    this.productos[index] = productoActualizado;

    return productoActualizado;
  }
}

describe('ProductoManager', () => {
  let manager: ProductoManager;

  beforeEach(() => {
    manager = new ProductoManager(
      new ProductoRepositoryFake() as unknown as ProductoRepository,
    );
  });

  it('consulta el catálogo de productos activos', async () => {
    const productos = await manager.consultarCatalogo();

    expect(productos).toHaveLength(1);
    expect(productos[0].idProducto).toBe(1);
    expect(productos[0].nombre).toBe('Polo básico');
    expect(productos[0].precioBase).toBe(35);
    expect(productos[0].imagenPrincipal).toBe(
      'https://example.com/polo-negro-front.png',
    );
  });

  it('consulta el detalle de producto activo', async () => {
    const producto = await manager.consultarDetalleProducto(1);

    expect(producto.idProducto).toBe(1);
    expect(producto.nombre).toBe('Polo básico');
    expect(producto.variantes).toHaveLength(2);
    expect(producto.imagenes).toHaveLength(1);
    expect(producto.descuentosVolumen).toHaveLength(1);
  });

  it('rechaza consultar detalle de producto inexistente', async () => {
    await expect(manager.consultarDetalleProducto(999)).rejects.toThrow(
      'Producto no encontrado.',
    );
  });

  it('registra producto en el catálogo', async () => {
    const producto = await manager.registrarProducto({
      idCategoria: 1,
      nombre: 'Casaca urbana',
      descripcion: 'Casaca personalizable para temporada de invierno',
      precioBase: 120,
      esPersonalizable: true,
      variantes: [
        {
          colorNombre: 'Azul',
          colorHex: '#0000FF',
          talla: 'M',
          stock: 8,
        },
      ],
      imagenes: [
        {
          colorHex: '#0000FF',
          lado: 'FRONT',
          urlImagen: 'https://example.com/casaca-azul-front.png',
          displayOrder: 0,
        },
      ],
      descuentosVolumen: [
        {
          cantidadMinima: 10,
          porcentajeDescuento: 8,
        },
      ],
    });

    expect(producto.idProducto).toBe(3);
    expect(producto.nombre).toBe('Casaca urbana');
    expect(producto.precioBase).toBe(120);
    expect(producto.variantes).toHaveLength(1);
    expect(producto.imagenes).toHaveLength(1);
    expect(producto.descuentosVolumen).toHaveLength(1);
  });

  it('rechaza registrar producto sin variantes', async () => {
    await expect(
      manager.registrarProducto({
        idCategoria: 1,
        nombre: 'Producto inválido',
        descripcion: 'Producto sin variantes',
        precioBase: 50,
        esPersonalizable: false,
        variantes: [],
        imagenes: [
          {
            colorHex: '#FFFFFF',
            lado: 'FRONT',
            urlImagen: 'https://example.com/producto.png',
          },
        ],
      }),
    ).rejects.toThrow('El producto debe tener al menos una variante.');
  });

  it('rechaza registrar producto con variantes duplicadas', async () => {
    await expect(
      manager.registrarProducto({
        idCategoria: 1,
        nombre: 'Producto duplicado',
        descripcion: 'Producto con variantes duplicadas',
        precioBase: 50,
        esPersonalizable: false,
        variantes: [
          {
            colorNombre: 'Blanco',
            colorHex: '#FFFFFF',
            talla: 'M',
            stock: 5,
          },
          {
            colorNombre: 'Blanco',
            colorHex: '#ffffff',
            talla: 'M',
            stock: 3,
          },
        ],
        imagenes: [
          {
            colorHex: '#FFFFFF',
            lado: 'FRONT',
            urlImagen: 'https://example.com/producto.png',
          },
        ],
      }),
    ).rejects.toThrow(
      'No se permiten variantes duplicadas por color y talla.',
    );
  });

  it('modifica producto del catálogo', async () => {
    const producto = await manager.modificarProducto(1, {
      nombre: 'Polo básico actualizado',
      precioBase: 39.9,
      esPersonalizable: false,
    });

    expect(producto.idProducto).toBe(1);
    expect(producto.nombre).toBe('Polo básico actualizado');
    expect(producto.precioBase).toBe(39.9);
    expect(producto.esPersonalizable).toBe(false);
  });

  it('rechaza modificar producto sin cambios', async () => {
    await expect(manager.modificarProducto(1, {})).rejects.toThrow(
      'Debe enviar al menos un dato para modificar.',
    );
  });

  it('rechaza modificar producto inexistente', async () => {
    await expect(
      manager.modificarProducto(999, {
        nombre: 'Producto inexistente',
      }),
    ).rejects.toThrow('Producto no encontrado.');
  });
});