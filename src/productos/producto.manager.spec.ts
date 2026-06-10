import { ProductoManager } from './producto.manager';
import { ProductoRamRepository } from './producto-ram.repository';
import { Producto } from './domain/producto.entity';

describe('ProductoManager - Caso de Uso 14: Eliminación lógica', () => {
  let manager: ProductoManager;
  let repository: ProductoRamRepository;

  beforeEach(() => {
    repository = new ProductoRamRepository();
    manager = new ProductoManager(repository);
  });

  it('debe desactivar un producto activo del catálogo de forma exitosa (flujo básico)', async () => {
    const producto = new Producto(
      1,
      'Polo de Algodón',
      'Polo 100% algodón',
      'polos',
      'activo',
      [{ nombre: 'M', precio: 30, stock: 10 }],
      ['http://imagen.com/1.png'],
      []
    );
    await repository.guardar(producto);

    const resultado = await manager.cambiarEstadoProducto(1, 'inactivo');

    expect(resultado).toBe('El producto ha sido desactivado del catálogo exitosamente.');
    const actualizado = await repository.buscarPorId(1);
    expect(actualizado?.estado).toBe('inactivo');
  });

  it('debe activar un producto inactivo del catálogo de forma exitosa (flujo alternativo)', async () => {
    const producto = new Producto(
      2,
      'Polera con Capucha',
      'Polera de invierno',
      'poleras',
      'inactivo',
      [{ nombre: 'L', precio: 50, stock: 5 }],
      ['http://imagen.com/2.png'],
      []
    );
    await repository.guardar(producto);

    const resultado = await manager.cambiarEstadoProducto(2, 'activo');

    expect(resultado).toBe('El producto ha sido activado en el catálogo exitosamente.');
    const actualizado = await repository.buscarPorId(2);
    expect(actualizado?.estado).toBe('activo');
  });

  it('debe lanzar error cuando el producto tiene pedidos en proceso (flujo excepcional)', async () => {
    // Si el ID es 999, ProductoRamRepository simula que tiene pedidos en proceso.
    const producto = new Producto(
      999,
      'Polo Especial',
      'Polo en producción',
      'polos',
      'activo',
      [{ nombre: 'S', precio: 35, stock: 20 }],
      ['http://imagen.com/3.png'],
      []
    );
    await repository.guardar(producto);

    await expect(
      manager.cambiarEstadoProducto(999, 'inactivo')
    ).rejects.toThrow('No es posible desactivar el producto porque tiene pedidos en proceso asociados.');

    const actualizado = await repository.buscarPorId(999);
    expect(actualizado?.estado).toBe('activo'); // No debe haber cambiado de estado
  });

  it('debe lanzar error cuando el producto no existe en el catálogo (flujo excepcional)', async () => {
    await expect(
      manager.cambiarEstadoProducto(404, 'inactivo')
    ).rejects.toThrow('Producto no encontrado.');
  });
});
