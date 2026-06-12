import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModificarProductoDto } from './dto/modificar-producto.dto';
import { RegistrarProductoDto } from './dto/registrar-producto.dto';
import { AdicionarStockDto } from './dto/adicionar-stock.dto';
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

  /**
   * Busca un producto activo por nombre (normalizado).
   * Si se provee excludeId, excluye ese producto de la búsqueda
   * (útil para validar unicidad al modificar el propio producto).
   */
  async buscarPorNombre(
    nombre: string,
    excludeId?: number,
  ): Promise<Producto | null> {
    const registro = await this.prisma.producto.findFirst({
      where: {
        nombre: {
          equals: nombre,
          mode: 'insensitive',
        },
        esActivo: true,
        fechaEliminacion: null,
        ...(excludeId !== undefined && {
          NOT: { idProducto: excludeId },
        }),
      },
      include: {
        categoria: true,
        variantes: false,
        imagenes: false,
        descuentosVolumen: false,
      },
    });

    return registro ? ProductoMapper.aEntidad(registro as ProductoRegistro) : null;
  }

  /**
   * Verifica si existen pedidos en estado activo asociados al producto.
   * Un pedido está "en proceso" si su estado es REGISTRADO, CONFIRMADO o PROCESANDO.
   */
  async verificarPedidosActivos(idProducto: number): Promise<boolean> {
    const count = await this.prisma.pedidoDetalle.count({
      where: {
        productoVariante: {
          idProducto,
        },
        pedido: {
          estado: {
            in: ['REGISTRADO', 'CONFIRMADO', 'PROCESANDO'],
          },
        },
      },
    });

    return count > 0;
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
    const productoExistente = await this.prisma.producto.findFirst({
      where: {
        idProducto,
        esActivo: true,
        fechaEliminacion: null,
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

    const productoActualizado = await this.buscarDetallePorId(idProducto);

    if (!productoActualizado) {
      throw new Error('Producto no encontrado.');
    }

    return productoActualizado;
  }

  /**
   * Adiciona stock de forma incremental a variantes existentes del producto.
   * A diferencia de `modificar`, no reemplaza las variantes: solo incrementa
   * el stock de las combinaciones color + talla indicadas.
   */
  async adicionarStock(
    idProducto: number,
    datos: AdicionarStockDto,
  ): Promise<Producto> {
    const productoExistente = await this.prisma.producto.findFirst({
      where: {
        idProducto,
        esActivo: true,
        fechaEliminacion: null,
      },
      select: { idProducto: true },
    });

    if (!productoExistente) {
      throw new Error('Producto no encontrado.');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const variante of datos.variantes) {
        const colorHexNorm = variante.colorHex.trim().toUpperCase();

        const varianteExistente = await tx.productoVariante.findFirst({
          where: {
            idProducto,
            colorHex: colorHexNorm,
            talla: variante.talla,
            esActivo: true,
            fechaEliminacion: null,
          },
        });

        if (!varianteExistente) {
          throw new Error(
            `No existe una variante activa para el color ${colorHexNorm} y talla ${variante.talla}.`,
          );
        }

        await tx.productoVariante.update({
          where: { idProductoVariante: varianteExistente.idProductoVariante },
          data: { stock: { increment: variante.stockAdicional } },
        });
      }
    });

    const productoActualizado = await this.buscarDetallePorId(idProducto);

    if (!productoActualizado) {
      throw new Error('Producto no encontrado.');
    }

    return productoActualizado;
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

  /**
   * Reactiva un producto que fue desactivado lógicamente.
   */
  async activar(idProducto: number): Promise<boolean> {
    const resultado = await this.prisma.producto.updateMany({
      where: {
        idProducto,
        esActivo: false,
      },
      data: {
        esActivo: true,
        fechaEliminacion: null,
      },
    });

    return resultado.count > 0;
  }
}