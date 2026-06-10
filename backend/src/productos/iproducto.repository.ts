// src/iproducto.repository.ts
import { Producto } from './domain/producto.entity';

export interface IProductoRepository {
  guardar(producto: Producto): Promise<boolean>;
  actualizar(producto: Producto): Promise<boolean>;
  buscarPorId(productoId: number): Promise<Producto | null>;
  buscarPorNombre(nombre: string): Promise<Producto | null>;
  obtenerCatalogoActivo(categoria?: string): Promise<Producto[]>;
  
  // Simulador de dependencia externa para el caso de excepción de eliminación lógica
  tienePedidosEnProceso(productoId: number): Promise<boolean>;
}