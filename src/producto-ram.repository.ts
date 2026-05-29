// src/producto-ram.repository.ts
import { IProductoRepository } from './iproducto.repository';
import { Producto } from './domain/producto.entity';

export class ProductoRamRepository implements IProductoRepository {
  private productosTable: Producto[] = [];

  async guardar(producto: Producto): Promise<boolean> {
    this.productosTable.push(producto);
    return true;
  }

  async actualizar(producto: Producto): Promise<boolean> {
    const index = this.productosTable.findIndex(p => p.idProducto === producto.idProducto);
    if (index === -1) return false;
    
    // Reemplazo en memoria profunda
    this.productosTable[index] = JSON.parse(JSON.stringify(producto));
    return true;
  }

  async buscarPorId(productoId: number): Promise<Producto | null> {
    const producto = this.productosTable.find(p => p.idProducto === productoId);
    return producto ? JSON.parse(JSON.stringify(producto)) : null;
  }

  async buscarPorNombre(nombre: string): Promise<Producto | null> {
    const producto = this.productosTable.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    return producto ? JSON.parse(JSON.stringify(producto)) : null;
  }

  async obtenerCatalogoActivo(categoria?: string): Promise<Producto[]> {
    let activos = this.productosTable.filter(p => p.estado === 'activo');
    if (categoria) {
      activos = activos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }
    return JSON.parse(JSON.stringify(activos));
  }

  async tienePedidosEnProceso(productoId: number): Promise<boolean> {
    // Hardcodeado para la prueba: si el ID es 999 simulamos que tiene pedidos.
    return productoId === 999; 
  }
}