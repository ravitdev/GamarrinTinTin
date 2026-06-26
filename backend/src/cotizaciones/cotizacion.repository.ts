import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cotizacion } from './domain/cotizacion.entity';
import type { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ICotizacionRepository } from './icotizacion.repository';
import { CotizacionMapper } from './cotizacion.mapper';

const relacionesCotizacion = {
  cliente: true,
  productoVariante: {
    include: {
      producto: {
        include: {
          categoria: true,
          descuentosVolumen: {
            where: {
              esActivo: true,
              fechaEliminacion: null,
            },
            orderBy: {
              cantidadMinima: 'asc' as const,
            },
          },
        },
      },
    },
  },
};

@Injectable()
export class CotizacionRepository implements ICotizacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    idCliente: number,
    datos: CrearCotizacionDto,
  ): Promise<Cotizacion> {
    const variante = await this.prisma.productoVariante.findFirst({
      where: {
        idProductoVariante: datos.idProductoVariante,
        esActivo: true,
        fechaEliminacion: null,
        producto: {
          esActivo: true,
          fechaEliminacion: null,
        },
      },
      include: {
        producto: true,
      },
    });

    if (!variante) {
      throw new Error('El producto seleccionado no se encuentra disponible.');
    }

    if (
      datos.razon === 'PERSONALIZACION' &&
      !variante.producto.esPersonalizable
    ) {
      throw new Error('El producto seleccionado no admite personalización.');
    }

    if (
      datos.razon === 'STOCK_INSUFICIENTE' &&
      datos.cantidad <= variante.stock
    ) {
      throw new Error(
        'El producto cuenta con stock suficiente para la cantidad solicitada.',
      );
    }

    const registro = await this.prisma.cotizacion.create({
      data: {
        idCliente,
        idProductoVariante: variante.idProductoVariante,
        cantidad: datos.cantidad,
        razon: datos.razon,
        estado: 'PENDIENTE',
        nombreProductoSnapshot: variante.producto.nombre,
        colorSnapshot: variante.colorNombre,
        tallaSnapshot: variante.talla,
        precioBaseSnapshot: variante.producto.precioBase,
      },
      include: relacionesCotizacion,
    });

    return CotizacionMapper.aEntidad(registro);
  }

  async buscarPorId(idCotizacion: number): Promise<Cotizacion | null> {
    const registro = await this.prisma.cotizacion.findUnique({
      where: { idCotizacion },
      include: relacionesCotizacion,
    });

    return registro ? CotizacionMapper.aEntidad(registro) : null;
  }

  async listarPorCliente(idCliente: number): Promise<Cotizacion[]> {
    const registros = await this.prisma.cotizacion.findMany({
      where: { idCliente },
      include: relacionesCotizacion,
      orderBy: { fechaCreacion: 'desc' },
    });

    return registros.map((registro) => CotizacionMapper.aEntidad(registro));
  }

  async listarSolicitudes(): Promise<Cotizacion[]> {
    const registros = await this.prisma.cotizacion.findMany({
      include: relacionesCotizacion,
      orderBy: { fechaCreacion: 'desc' },
    });

    return registros.map((registro) => CotizacionMapper.aEntidad(registro));
  }

  async responder(
    idCotizacion: number,
    atendidoPorId: number,
    precioCotizado: number,
    fechaExpiracion: Date,
  ): Promise<Cotizacion | null> {
    const resultado = await this.prisma.cotizacion.updateMany({
      where: {
        idCotizacion,
        estado: 'PENDIENTE',
      },
      data: {
        atendidoPorId,
        precioCotizado,
        estado: 'COTIZADO',
        fechaCotizacion: new Date(),
        fechaExpiracion,
      },
    });

    if (resultado.count === 0) {
      return null;
    }

    return this.buscarPorId(idCotizacion);
  }

  async agregarAlCarrito(
    idCotizacion: number,
    idCliente: number,
  ): Promise<Cotizacion | null> {
    return this.prisma.$transaction(async (tx) => {
      const registro = await tx.cotizacion.findFirst({
        where: {
          idCotizacion,
          idCliente,
        },
        include: relacionesCotizacion,
      });

      if (!registro) {
        return null;
      }

      const cotizacion = CotizacionMapper.aEntidad(registro);

      if (!cotizacion.puedeAgregarseAlCarrito()) {
        throw new Error(
          cotizacion.estaVencida()
            ? 'La cotización ha expirado.'
            : 'Solo las cotizaciones cotizadas pueden agregarse al carrito.',
        );
      }

      const carrito = await tx.carrito.upsert({
        where: { idUsuario: idCliente },
        update: {},
        create: { idUsuario: idCliente },
      });

      await tx.itemCarrito.upsert({
        where: { idCotizacion },
        update: {
          idCarrito: carrito.idCarrito,
          cantidad: cotizacion.cantidad,
          tipoItem: 'COTIZACION',
          idProductoVariante: cotizacion.idProductoVariante,
        },
        create: {
          idCarrito: carrito.idCarrito,
          tipoItem: 'COTIZACION',
          idProductoVariante: cotizacion.idProductoVariante,
          idCotizacion,
          cantidad: cotizacion.cantidad,
        },
      });

      return cotizacion;
    });
  }

  async cancelarPropia(
    idCotizacion: number,
    idCliente: number,
  ): Promise<Cotizacion | null> {
    return this.prisma.$transaction(async (tx) => {
      const registro = await tx.cotizacion.findFirst({
        where: {
          idCotizacion,
          idCliente,
        },
        include: relacionesCotizacion,
      });

      if (!registro) {
        return null;
      }

      if (!['PENDIENTE', 'COTIZADO'].includes(registro.estado)) {
        throw new Error(
          'Solo se pueden cancelar cotizaciones pendientes o cotizadas.',
        );
      }

      await tx.itemCarrito.deleteMany({
        where: { idCotizacion },
      });

      await tx.cotizacion.update({
        where: { idCotizacion },
        data: {
          estado: 'RECHAZADO',
        },
      });

      const cotizacion = CotizacionMapper.aEntidad(registro);
      cotizacion.estado = 'RECHAZADO';
      return cotizacion;
    });
  }

  async cancelarVencidas(fechaActual: Date): Promise<Cotizacion[]> {
    return this.prisma.$transaction(async (tx) => {
      const vencidas = await tx.cotizacion.findMany({
        where: {
          estado: 'COTIZADO',
          fechaExpiracion: {
            lte: fechaActual,
          },
        },
        include: relacionesCotizacion,
      });

      if (vencidas.length === 0) {
        return [];
      }

      const ids = vencidas.map((cotizacion) => cotizacion.idCotizacion);

      await tx.itemCarrito.deleteMany({
        where: {
          idCotizacion: {
            in: ids,
          },
        },
      });

      await tx.cotizacion.updateMany({
        where: {
          idCotizacion: {
            in: ids,
          },
          estado: 'COTIZADO',
        },
        data: {
          estado: 'EXPIRADO',
        },
      });

      return vencidas.map((registro) => {
        const cotizacion = CotizacionMapper.aEntidad(registro);
        cotizacion.estado = 'EXPIRADO';
        return cotizacion;
      });
    });
  }
}
