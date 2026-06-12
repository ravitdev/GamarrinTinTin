import { Producto } from './domain/producto.entity';
import { RegistrarProductoDto } from './dto/registrar-producto.dto';
import { ModificarProductoDto } from './dto/modificar-producto.dto';
import { AdicionarStockDto } from './dto/adicionar-stock.dto';
import { ProductoManager } from './producto.manager';
import { ProductoRepository } from './producto.repository';

// ─────────────────────────────────────────────────────────────────────────────
// Fake repository (in-memory) para pruebas unitarias
// ─────────────────────────────────────────────────────────────────────────────
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
    new Producto(
      3,
      2,
      'Polera Sport',
      'Polera deportiva para uso casual',
      55,
      false,
      true,
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-01T00:00:00.000Z'),
      {
        idCategoria: 2,
        nombre: 'Poleras',
      },
      [
        {
          idProductoVariante: 10,
          idProducto: 3,
          colorNombre: 'Blanco',
          colorHex: '#FFFFFF',
          talla: 'M',
          stock: 8,
          esActivo: true,
        },
      ],
      [
        {
          idProductoImagen: 10,
          idProducto: 3,
          colorHex: '#FFFFFF',
          lado: 'FRONT',
          urlImagen: 'https://example.com/polera-blanca-front.png',
          displayOrder: 0,
          esActivo: true,
        },
      ],
      [],
    ),
  ];

  // Mapa de idProducto → hay pedidos activos (para P21)
  private pedidosActivos: Record<number, boolean> = {};

  /** Configura si un producto tiene pedidos activos (para tests de P21) */
  simularPedidosActivos(idProducto: number, tieneActivos: boolean) {
    this.pedidosActivos[idProducto] = tieneActivos;
  }

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

  async buscarPorNombre(nombre: string, excludeId?: number): Promise<Producto | null> {
    return (
      this.productos.find(
        (producto) =>
          producto.nombre.toLowerCase() === nombre.toLowerCase() &&
          producto.esActivo &&
          (excludeId === undefined || producto.idProducto !== excludeId),
      ) ?? null
    );
  }

  async verificarPedidosActivos(idProducto: number): Promise<boolean> {
    return this.pedidosActivos[idProducto] ?? false;
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

  async adicionarStock(idProducto: number, datos: AdicionarStockDto): Promise<Producto> {
    const producto = await this.buscarDetallePorId(idProducto);

    if (!producto) {
      throw new Error('Producto no encontrado.');
    }

    const variantesActualizadas = producto.variantes.map((variante) => {
      const adicion = datos.variantes.find(
        (v) =>
          v.colorHex.trim().toUpperCase() === variante.colorHex.toUpperCase() &&
          v.talla === variante.talla,
      );

      if (adicion) {
        return {
          ...variante,
          stock: variante.stock + adicion.stockAdicional,
        };
      }

      return variante;
    });

    // Validar que todas las variantes del DTO existan
    for (const v of datos.variantes) {
      const existe = producto.variantes.some(
        (pv) =>
          pv.colorHex.toUpperCase() === v.colorHex.trim().toUpperCase() &&
          pv.talla === v.talla &&
          pv.esActivo,
      );
      if (!existe) {
        throw new Error(
          `No existe una variante activa para el color ${v.colorHex} y talla ${v.talla}.`,
        );
      }
    }

    const productoActualizado = new Producto(
      producto.idProducto,
      producto.idCategoria,
      producto.nombre,
      producto.descripcion,
      producto.precioBase,
      producto.esPersonalizable,
      producto.esActivo,
      producto.fechaCreacion,
      new Date('2026-06-03T00:00:00.000Z'),
      producto.categoria,
      variantesActualizadas,
      producto.imagenes,
      producto.descuentosVolumen,
    );

    const index = this.productos.findIndex((p) => p.idProducto === idProducto);
    this.productos[index] = productoActualizado;

    return productoActualizado;
  }

  async desactivar(idProducto: number): Promise<boolean> {
    const index = this.productos.findIndex((p) => p.idProducto === idProducto && p.esActivo);

    if (index === -1) return false;

    const producto = this.productos[index];
    this.productos[index] = new Producto(
      producto.idProducto,
      producto.idCategoria,
      producto.nombre,
      producto.descripcion,
      producto.precioBase,
      producto.esPersonalizable,
      false, // esActivo = false
      producto.fechaCreacion,
      new Date(),
      producto.categoria,
      producto.variantes,
      producto.imagenes,
      producto.descuentosVolumen,
    );

    return true;
  }

  async activar(idProducto: number): Promise<boolean> {
    const index = this.productos.findIndex(
      (p) => p.idProducto === idProducto && !p.esActivo,
    );

    if (index === -1) return false;

    const producto = this.productos[index];
    this.productos[index] = new Producto(
      producto.idProducto,
      producto.idCategoria,
      producto.nombre,
      producto.descripcion,
      producto.precioBase,
      producto.esPersonalizable,
      true, // esActivo = true
      producto.fechaCreacion,
      new Date(),
      producto.categoria,
      producto.variantes,
      producto.imagenes,
      producto.descuentosVolumen,
    );

    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite de pruebas unitarias
// ─────────────────────────────────────────────────────────────────────────────
describe('ProductoManager', () => {
  let manager: ProductoManager;
  let repositoryFake: ProductoRepositoryFake;

  beforeEach(() => {
    repositoryFake = new ProductoRepositoryFake();
    manager = new ProductoManager(
      repositoryFake as unknown as ProductoRepository,
    );
  });

  // ── CU-01: Consultar catálogo ───────────────────────────────────────────

  // P1: Mostrar solo productos activos
  it('P1 - consulta el catálogo de productos activos (excluye inactivos)', async () => {
    const productos = await manager.consultarCatalogo();

    // Fixture: 2 activos (id=1 y id=3), 1 inactivo (id=2)
    expect(productos).toHaveLength(2);
    expect(productos.map((p) => p.idProducto)).toEqual(expect.arrayContaining([1, 3]));
    expect(productos.find((p) => p.idProducto === 2)).toBeUndefined();
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

  // ── CU-02: Registrar producto ───────────────────────────────────────────

  // P9: Flujo básico — registro exitoso
  it('P9 - registra producto en el catálogo exitosamente', async () => {
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

    expect(producto.idProducto).toBe(4);
    expect(producto.nombre).toBe('Casaca urbana');
    expect(producto.precioBase).toBe(120);
    expect(producto.variantes).toHaveLength(1);
    expect(producto.imagenes).toHaveLength(1);
    expect(producto.descuentosVolumen).toHaveLength(1);
  });

  // P10: Múltiples rangos de descuento
  it('P10 - registra producto con tres rangos de descuento por volumen', async () => {
    const producto = await manager.registrarProducto({
      idCategoria: 1,
      nombre: 'Polo Premium con descuentos',
      descripcion: 'Polo con múltiples rangos de descuento',
      precioBase: 80,
      esPersonalizable: false,
      variantes: [
        { colorNombre: 'Rojo', colorHex: '#FF0000', talla: 'L', stock: 20 },
      ],
      imagenes: [
        {
          colorHex: '#FF0000',
          lado: 'FRONT',
          urlImagen: 'https://example.com/polo-rojo.png',
        },
      ],
      descuentosVolumen: [
        { cantidadMinima: 10, porcentajeDescuento: 5 },
        { cantidadMinima: 20, porcentajeDescuento: 10 },
        { cantidadMinima: 50, porcentajeDescuento: 15 },
      ],
    });

    expect(producto.descuentosVolumen).toHaveLength(3);
    expect(producto.descuentosVolumen[0].cantidadMinima).toBe(10);
    expect(producto.descuentosVolumen[1].cantidadMinima).toBe(20);
    expect(producto.descuentosVolumen[2].cantidadMinima).toBe(50);
  });

  // P11: Nombre duplicado al registrar
  it('P11 - rechaza registrar producto con nombre ya existente en el catálogo', async () => {
    await expect(
      manager.registrarProducto({
        idCategoria: 1,
        nombre: 'Polo básico', // ya existe (id=1)
        descripcion: 'Otro polo básico',
        precioBase: 40,
        esPersonalizable: false,
        variantes: [
          { colorNombre: 'Blanco', colorHex: '#FFFFFF', talla: 'S', stock: 5 },
        ],
        imagenes: [
          {
            colorHex: '#FFFFFF',
            lado: 'FRONT',
            urlImagen: 'https://example.com/polo-blanco.png',
          },
        ],
      }),
    ).rejects.toThrow('El nombre del producto ya se encuentra registrado en el catálogo.');
  });

  // P6/P12: Campos obligatorios vacíos
  it('P6/P12 - rechaza registrar producto sin nombre', async () => {
    await expect(
      manager.registrarProducto({
        idCategoria: 1,
        nombre: '',
        descripcion: 'Descripción válida',
        precioBase: 50,
        esPersonalizable: false,
        variantes: [
          { colorNombre: 'Negro', colorHex: '#000000', talla: 'M', stock: 5 },
        ],
        imagenes: [
          {
            colorHex: '#000000',
            lado: 'FRONT',
            urlImagen: 'https://example.com/polo.png',
          },
        ],
      }),
    ).rejects.toThrow('El nombre del producto es obligatorio.');
  });

  it('P12 - rechaza registrar producto sin precio', async () => {
    await expect(
      manager.registrarProducto({
        idCategoria: 1,
        nombre: 'Polo sin precio',
        descripcion: 'Descripción',
        precioBase: 0, // precio inválido (≤0)
        esPersonalizable: false,
        variantes: [
          { colorNombre: 'Negro', colorHex: '#000000', talla: 'M', stock: 5 },
        ],
        imagenes: [
          {
            colorHex: '#000000',
            lado: 'FRONT',
            urlImagen: 'https://example.com/polo.png',
          },
        ],
      }),
    ).rejects.toThrow('El precio base debe ser mayor a cero.');
  });

  // P8: Descuentos con cantidadMinima duplicada al registrar
  it('P8 - rechaza registrar producto con rangos de descuento duplicados', async () => {
    await expect(
      manager.registrarProducto({
        idCategoria: 1,
        nombre: 'Polo con descuentos duplicados',
        descripcion: 'Polo de prueba',
        precioBase: 50,
        esPersonalizable: false,
        variantes: [
          { colorNombre: 'Blanco', colorHex: '#FFFFFF', talla: 'M', stock: 5 },
        ],
        imagenes: [
          {
            colorHex: '#FFFFFF',
            lado: 'FRONT',
            urlImagen: 'https://example.com/polo.png',
          },
        ],
        descuentosVolumen: [
          { cantidadMinima: 10, porcentajeDescuento: 5 }, // misma cantidadMinima
          { cantidadMinima: 10, porcentajeDescuento: 8 }, // duplicada
        ],
      }),
    ).rejects.toThrow('Los rangos de volumen no pueden superponerse.');
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

  // ── CU-03: Modificar producto ───────────────────────────────────────────

  // P15: Flujo básico — modificación exitosa
  it('P15 - modifica producto del catálogo exitosamente', async () => {
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

  // P17: Nombre duplicado al modificar
  it('P17 - rechaza modificar nombre a uno ya existente en otro producto', async () => {
    // Intentar renombrar "Polo básico" (id=1) a "Polera Sport" (id=3, ya existe)
    await expect(
      manager.modificarProducto(1, {
        nombre: 'Polera Sport',
      }),
    ).rejects.toThrow('El nombre del producto ya se encuentra registrado en el catálogo.');
  });

  // P17: El propio nombre no debe disparar el error
  it('P17 - permite modificar un producto sin cambiar el nombre (mismo nombre propio)', async () => {
    const producto = await manager.modificarProducto(1, {
      nombre: 'Polo básico', // mismo nombre del producto id=1
      precioBase: 40,
    });

    expect(producto.nombre).toBe('Polo básico');
    expect(producto.precioBase).toBe(40);
  });

  // P18: Descuentos superpuestos al modificar
  it('P18 - rechaza modificar con rangos de descuento superpuestos', async () => {
    await expect(
      manager.modificarProducto(1, {
        descuentosVolumen: [
          { cantidadMinima: 20, porcentajeDescuento: 5 },
          { cantidadMinima: 20, porcentajeDescuento: 8 }, // duplicada
        ],
      }),
    ).rejects.toThrow('Los rangos de volumen no pueden superponerse.');
  });

  // P13: Precio inválido al modificar
  it('P13 - rechaza modificar producto con precio negativo', async () => {
    await expect(
      manager.modificarProducto(1, {
        precioBase: -50,
      }),
    ).rejects.toThrow('El precio base debe ser mayor a cero.');
  });

  it('P13 - rechaza modificar producto con precio cero', async () => {
    await expect(
      manager.modificarProducto(1, {
        precioBase: 0,
      }),
    ).rejects.toThrow('El precio base debe ser mayor a cero.');
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

  // P16: Adicionar inventario
  it('P16 - adiciona stock a una variante existente', async () => {
    // Estado inicial: Polo básico id=1, variante #000000-M tiene 10 unidades
    const producto = await manager.adicionarStockProducto(1, {
      variantes: [
        { colorHex: '#000000', talla: 'M', stockAdicional: 20 },
      ],
    });

    const varianteMNegra = producto.variantes.find(
      (v) => v.talla === 'M' && v.colorHex.toUpperCase() === '#000000',
    );

    expect(varianteMNegra).toBeDefined();
    expect(varianteMNegra!.stock).toBe(30); // 10 + 20 = 30
  });

  it('P16 - rechaza adicionar stock para variante inexistente', async () => {
    await expect(
      manager.adicionarStockProducto(1, {
        variantes: [
          { colorHex: '#FF0000', talla: 'XL', stockAdicional: 5 }, // no existe
        ],
      }),
    ).rejects.toThrow();
  });

  it('P16 - rechaza adicionar stock con cantidad no positiva', async () => {
    await expect(
      manager.adicionarStockProducto(1, {
        variantes: [
          { colorHex: '#000000', talla: 'M', stockAdicional: 0 }, // debe ser >0
        ],
      }),
    ).rejects.toThrow('El stock adicional debe ser un entero mayor a cero.');
  });

  // ── CU-04: Eliminación lógica ───────────────────────────────────────────

  // P19: Desactivar producto exitosamente
  it('P19 - desactiva un producto activo sin pedidos en proceso', async () => {
    // id=1 está activo y sin pedidos activos
    const resultado = await manager.desactivarProducto(1);

    expect(resultado).toBe(true);

    // Verificar que ya no aparece en el catálogo
    const catalogo = await manager.consultarCatalogo();
    expect(catalogo.find((p) => p.idProducto === 1)).toBeUndefined();
  });

  // P21: Rechazar desactivar producto con pedidos activos
  it('P21 - rechaza desactivar producto con pedidos en proceso asociados', async () => {
    // Simular que el producto id=1 tiene pedidos activos
    repositoryFake.simularPedidosActivos(1, true);

    await expect(manager.desactivarProducto(1)).rejects.toThrow(
      'No es posible desactivar el producto porque tiene pedidos en proceso asociados.',
    );
  });

  it('rechaza desactivar producto inexistente', async () => {
    await expect(manager.desactivarProducto(999)).rejects.toThrow(
      'Producto no encontrado.',
    );
  });

  // P20: Reactivar producto inactivo
  it('P20 - reactiva un producto inactivo', async () => {
    // id=2 está inactivo (esActivo=false)
    const resultado = await manager.activarProducto(2);

    expect(resultado).toBe(true);

    // Verificar que ahora aparece en el catálogo
    const catalogo = await manager.consultarCatalogo();
    expect(catalogo.find((p) => p.idProducto === 2)).toBeDefined();
  });

  it('P20 - rechaza activar producto que ya está activo', async () => {
    await expect(manager.activarProducto(1)).rejects.toThrow(
      'Producto no encontrado o ya se encuentra activo.',
    );
  });
});