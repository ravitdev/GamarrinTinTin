import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IProductoRepository } from './../src/productos/iproducto.repository';
import { Producto } from './../src/productos/domain/producto.entity';

describe('ProductosController (e2e) - Caso de Uso 14: Eliminación lógica', () => {
  let app: INestApplication<App>;
  let repository: IProductoRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repository = moduleFixture.get<IProductoRepository>('IProductoRepository');
  });

  afterEach(async () => {
    await app.close();
  });

  it('debe desactivar un producto activo del catálogo (PUT /productos/:id/estado)', async () => {
    const producto = new Producto(
      101,
      'Polo E2E Activo',
      'Polo para pruebas e2e',
      'polos',
      'activo',
      [{ nombre: 'M', precio: 30, stock: 10 }],
      []
    );
    await repository.guardar(producto);

    const res = await request(app.getHttpServer())
      .put('/productos/101/estado')
      .send({ estado: 'inactivo' })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      message: 'El producto ha sido desactivado del catálogo exitosamente.',
    });

    const actualizado = await repository.buscarPorId(101);
    expect(actualizado?.estado).toBe('inactivo');
  });

  it('debe reactivar un producto inactivo del catálogo (PUT /productos/:id/estado)', async () => {
    const producto = new Producto(
      102,
      'Polo E2E Inactivo',
      'Polo para pruebas e2e',
      'polos',
      'inactivo',
      [{ nombre: 'M', precio: 30, stock: 10 }],
      []
    );
    await repository.guardar(producto);

    const res = await request(app.getHttpServer())
      .put('/productos/102/estado')
      .send({ estado: 'activo' })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      message: 'El producto ha sido activado en el catálogo exitosamente.',
    });

    const actualizado = await repository.buscarPorId(102);
    expect(actualizado?.estado).toBe('activo');
  });

  it('debe fallar al desactivar un producto con pedidos en proceso (PUT /productos/999/estado)', async () => {
    // ID 999 simula tener pedidos en proceso
    const producto = new Producto(
      999,
      'Polo E2E con Pedidos',
      'Polo para pruebas e2e',
      'polos',
      'activo',
      [{ nombre: 'M', precio: 30, stock: 10 }],
      []
    );
    await repository.guardar(producto);

    const res = await request(app.getHttpServer())
      .put('/productos/999/estado')
      .send({ estado: 'inactivo' })
      .expect(400);

    expect(res.body.message).toBe('No es posible desactivar el producto porque tiene pedidos en proceso asociados.');
  });

  it('debe devolver 400 si el producto no existe (PUT /productos/:id/estado)', async () => {
    const res = await request(app.getHttpServer())
      .put('/productos/404/estado')
      .send({ estado: 'inactivo' })
      .expect(400);

    expect(res.body.message).toBe('Producto no encontrado.');
  });
});
