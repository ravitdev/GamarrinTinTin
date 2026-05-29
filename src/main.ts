// src/main.ts
import { ProductoRamRepository } from './producto-ram.repository';
import { ProductoManager } from './producto.manager';

async function bootstrap() {
  const repo = new ProductoRamRepository();
  const manager = new ProductoManager(repo);

  try {
    console.log('--- 🚀 INICIANDO PRUEBAS DE CASOS DE USO ---');

    // CU 1: REGISTRAR PRODUCTO
    console.log('\n> CU 1: Registrando producto con tallas y precios diferenciados...');
    const msj1 = await manager.registrarProducto(
      1, 
      'Polo Oversized Anime', 
      'Polo estampado en algodón', 
      'Polos', 
      [
        { nombre: 'S', precio: 35, stock: 10 },
        { nombre: 'M', precio: 35, stock: 15 },
        { nombre: 'XL', precio: 40, stock: 5 } // Precio diferenciado
      ],
      ['diseno_goku.png', 'diseno_naruto.png'] // Múltiples diseños
    );
    console.log(msj1);

    // CU 4: AGREGAR DESCUENTO
    console.log('\n> CU 4: Configurando descuentos por volumen...');
    const msj4 = await manager.configurarDescuento(1, 12, 10);
    console.log(msj4);

    // CU 4 (Excepción): INTENTAR DUPLICAR DESCUENTO
    try {
      console.log('> CU 4 (Exc): Intentando registrar el mismo rango...');
      await manager.configurarDescuento(1, 12, 15);
    } catch (e: any) {
      console.log('Excepción capturada:', e.message);
    }

    // CU 5: CONSULTAR CATÁLOGO
    console.log('\n> CU 5: Consultando Catálogo (Categoría: Polos, Filtro: Talla XL)...');
    const listado = await manager.consultarCatalogo('Polos', 'XL');
    console.log('Listado para el cliente:', listado);

    // CU 3: ELIMINACIÓN LÓGICA
    console.log('\n> CU 3: Desactivando producto...');
    const msj3 = await manager.cambiarEstadoProducto(1, 'inactivo');
    console.log(msj3);

    // CU 5 (Excepción): CONSULTAR CATÁLOGO VACÍO
    try {
      console.log('\n> CU 5 (Exc): Consultando catálogo luego de desactivar el producto...');
      await manager.consultarCatalogo('Polos');
    } catch (e: any) {
      console.log('Excepción capturada:', e.message);
    }

  } catch (error) {
    console.error('Error no controlado:', error);
  }
}

bootstrap();