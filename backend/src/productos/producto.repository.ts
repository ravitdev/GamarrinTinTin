import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModificarProductoDto } from './dto/modificar-producto.dto';
import { RegistrarProductoDto } from './dto/registrar-producto.dto';
import { Producto } from './domain/producto.entity';
import { ProductoMapper, ProductoRegistro } from './producto.mapper';

@Injectable()
export class ProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarCatalogo(): Promise<Producto[]> {
    const registros = await this.prisma.producto.findMany({
      where: {
        esActivo: true,
        fechaEliminacion: null,
      },
      include: {
        categoria: true,
        variantes: {
          where: {
            esActivo: true,
            fechaEliminacion: null,
          },
          orderBy: [
            {
              colorNombre: 'asc',
            },
            {
              talla: 'asc',
            },
          ],
        },
        imagenes: {
          where: {
            esActivo: true,
            fechaEliminacion: null,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return registros.map((registro) =>
      ProductoMapper.aEntidad(registro as ProductoRegistro),
    );
  }

  async listarTodosParaAdministracion(): Promise<Producto[]> {
    const registros = await this.prisma.producto.findMany({
      include: {
        categoria: true,
        variantes: {
          orderBy: [
            {
              colorNombre: 'asc',
            },
            {
              talla: 'asc',
            },
          ],
        },
        imagenes: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        descuentosVolumen: {
          orderBy: {
            cantidadMinima: 'asc',
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return registros.map((registro) =>
      ProductoMapper.aEntidad(registro as ProductoRegistro),
    );
  }

  async buscarDetallePorId(idProducto: number): Promise<Producto | null> {
    const registro = await this.prisma.producto.findFirst({
      where: {
        idProducto,
        esActivo: true,
        fechaEliminacion: null,
      },
      include: {
        categoria: true,
        variantes: {
          where: {
            esActivo: true,
            fechaEliminacion: null,
          },
          orderBy: [
            {
              colorNombre: 'asc',
            },
            {
              talla: 'asc',
            },
          ],
        },
        imagenes: {
          where: {
            esActivo: true,
            fechaEliminacion: null,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        descuentosVolumen: {
          where: {
            esActivo: true,
            fechaEliminacion: null,
          },
          orderBy: {
            cantidadMinima: 'asc',
          },
        },
      },
    });

    return registro ? ProductoMapper.aEntidad(registro as ProductoRegistro) : null;
  }

  async registrar(datos: RegistrarProductoDto): Promise<Producto> {
    const registro = await this.prisma.producto.create({
      data: {
        idCategoria: datos.idCategoria,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precioBase: datos.precioBase,
        esPersonalizable: datos.esPersonalizable,
        variantes: {
          create: datos.variantes.map((variante) => ({
            colorNombre: variante.colorNombre,
            colorHex: variante.colorHex,
            talla: variante.talla,
            stock: variante.stock,
          })),
        },
        imagenes: {
          create: datos.imagenes.map((imagen) => ({
            colorHex: imagen.colorHex,
            lado: imagen.lado,
            urlImagen: imagen.urlImagen,
            displayOrder: imagen.displayOrder ?? 0,
          })),
        },
        descuentosVolumen: {
          create: (datos.descuentosVolumen ?? []).map((descuento) => ({
            cantidadMinima: descuento.cantidadMinima,
            porcentajeDescuento: descuento.porcentajeDescuento,
          })),
        },
      },
      include: {
        categoria: true,
        variantes: true,
        imagenes: true,
        descuentosVolumen: true,
      },
    });

    return ProductoMapper.aEntidad(registro as ProductoRegistro);
  }

  async modificar(
    idProducto: number,
    datos: ModificarProductoDto,
  ): Promise<Producto> {
    const productoExistente = await this.prisma.producto.findUnique({
      where: {
        idProducto,
      },
      select: {
        idProducto: true,
      },
    });

    if (!productoExistente) {
      throw new Error('Producto no encontrado.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.producto.update({
        where: {
          idProducto,
        },
        data: {
          idCategoria: datos.idCategoria,
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          precioBase: datos.precioBase,
          esPersonalizable: datos.esPersonalizable,
        },
      });

      if (datos.variantes) {
        await tx.productoVariante.updateMany({
          where: {
            idProducto,
            esActivo: true,
          },
          data: {
            esActivo: false,
            fechaEliminacion: new Date(),
          },
        });

        await tx.productoVariante.createMany({
          data: datos.variantes.map((variante) => ({
            idProducto,
            colorNombre: variante.colorNombre,
            colorHex: variante.colorHex,
            talla: variante.talla,
            stock: variante.stock,
          })),
        });
      }

      if (datos.imagenes) {
        await tx.productoImagen.updateMany({
          where: {
            idProducto,
            esActivo: true,
          },
          data: {
            esActivo: false,
            fechaEliminacion: new Date(),
          },
        });

        await tx.productoImagen.createMany({
          data: datos.imagenes.map((imagen) => ({
            idProducto,
            colorHex: imagen.colorHex,
            lado: imagen.lado,
            urlImagen: imagen.urlImagen,
            displayOrder: imagen.displayOrder ?? 0,
          })),
        });
      }

      if (datos.descuentosVolumen) {
        await tx.descuentoVolumen.updateMany({
          where: {
            idProducto,
            esActivo: true,
          },
          data: {
            esActivo: false,
            fechaEliminacion: new Date(),
          },
        });

        await tx.descuentoVolumen.createMany({
          data: datos.descuentosVolumen.map((descuento) => ({
            idProducto,
            cantidadMinima: descuento.cantidadMinima,
            porcentajeDescuento: descuento.porcentajeDescuento,
          })),
        });
      }
    });

    const productoActualizado =
      await this.buscarDetalleAdministracionPorId(idProducto);

    if (!productoActualizado) {
      throw new Error('Producto no encontrado.');
    }

    return ProductoMapper.aEntidad(productoActualizado as ProductoRegistro);
  }

  async desactivar(idProducto: number): Promise<boolean> {
    const resultado = await this.prisma.producto.updateMany({
      where: { idProducto, esActivo: true },
      data: {
        esActivo: false,
        fechaEliminacion: new Date(),
      },
    });

    return resultado.count > 0;
  }

  async cambiarEstado(idProducto: number, esActivo: boolean): Promise<Producto> {
    const productoExistente = await this.prisma.producto.findUnique({
      where: {
        idProducto,
      },
      select: {
        idProducto: true,
      },
    });

    if (!productoExistente) {
      throw new Error('Producto no encontrado.');
    }

    await this.prisma.producto.update({
      where: {
        idProducto,
      },
      data: {
        esActivo,
        fechaEliminacion: esActivo ? null : new Date(),
      },
    });

    const registro = await this.buscarDetalleAdministracionPorId(idProducto);

    if (!registro) {
      throw new Error('Producto no encontrado.');
    }

    return ProductoMapper.aEntidad(registro as ProductoRegistro);
  }

  private async buscarDetalleAdministracionPorId(
    idProducto: number,
  ): Promise<ProductoRegistro | null> {
    return this.prisma.producto.findUnique({
      where: {
        idProducto,
      },
      include: {
        categoria: true,
        variantes: {
          orderBy: [
            {
              colorNombre: 'asc',
            },
            {
              talla: 'asc',
            },
          ],
        },
        imagenes: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        descuentosVolumen: {
          orderBy: {
            cantidadMinima: 'asc',
          },
        },
      },
    }) as Promise<ProductoRegistro | null>;
  }
}
