import {
  RegistrarDescuentoVolumenDto,
  RegistrarProductoImagenDto,
  RegistrarProductoVarianteDto,
} from './registrar-producto.dto';

export interface ModificarProductoDto {
  idCategoria?: number;
  nombre?: string;
  descripcion?: string;
  precioBase?: number;
  esPersonalizable?: boolean;
  variantes?: RegistrarProductoVarianteDto[];
  imagenes?: RegistrarProductoImagenDto[];
  descuentosVolumen?: RegistrarDescuentoVolumenDto[];
}