import { Talla } from '../domain/producto.entity';

/**
 * Item de adición de stock para una combinación color + talla específica.
 */
export interface AdicionarStockVarianteDto {
  colorHex: string;
  talla: Talla;
  stockAdicional: number;
}

/**
 * DTO para adicionar inventario a un producto existente.
 * A diferencia de modificar variantes (que es destructivo),
 * este endpoint solo incrementa el stock de variantes ya existentes.
 */
export interface AdicionarStockDto {
  variantes: AdicionarStockVarianteDto[];
}
