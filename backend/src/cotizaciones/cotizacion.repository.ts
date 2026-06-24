import { Injectable } from '@nestjs/common';
import { EstadoCotizacion, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const cotizacionInclude = {
  cliente: true,
  productoVariante: {
    include: {
      producto: {
        include: {
          descuentosVolumen: true,
        },
      },
    },
  },
  personalizacion: {
    include: {
      imagenes: {
        include: {
          disenoPredefinido: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  },
} satisfies Prisma.CotizacionInclude;

export type CotizacionConDetalle = Prisma.CotizacionGetPayload<{
  include: typeof cotizacionInclude;
}>;

@Injectable()
export class CotizacionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: Prisma.CotizacionCreateInput): Promise<CotizacionConDetalle> {
    return this.prisma.cotizacion.create({
      data,
      include: cotizacionInclude,
    });
  }

  async listarPorCliente(idCliente: number): Promise<CotizacionConDetalle[]> {
    return this.prisma.cotizacion.findMany({
      where: {
        idCliente,
      },
      include: cotizacionInclude,
      orderBy: {
        fechaCreacion: 'desc',
      },
    });
  }

  async listarTodas(): Promise<CotizacionConDetalle[]> {
    return this.prisma.cotizacion.findMany({
      include: cotizacionInclude,
      orderBy: {
        fechaCreacion: 'desc',
      },
    });
  }

  async buscarPorId(idCotizacion: number): Promise<CotizacionConDetalle | null> {
    return this.prisma.cotizacion.findUnique({
      where: {
        idCotizacion,
      },
      include: cotizacionInclude,
    });
  }

  async buscarProductoVariante(idProductoVariante: number) {
    return this.prisma.productoVariante.findUnique({
      where: {
        idProductoVariante,
      },
      include: {
        producto: {
          include: {
            descuentosVolumen: true,
          },
        },
      },
    });
  }

  async responder(params: {
    idCotizacion: number;
    atendidoPorId: number;
    precioPropuesto: number;
    fechaCotizacion: Date;
    fechaExpiracion: Date;
  }): Promise<CotizacionConDetalle> {
    return this.prisma.cotizacion.update({
      where: {
        idCotizacion: params.idCotizacion,
      },
      data: {
        atendidoPorId: params.atendidoPorId,
        precioCotizado: params.precioPropuesto,
        estado: EstadoCotizacion.COTIZADO,
        fechaCotizacion: params.fechaCotizacion,
        fechaExpiracion: params.fechaExpiracion,
      },
      include: cotizacionInclude,
    });
  }

  /**
   * Marca como EXPIRADO las cotizaciones COTIZADO cuyo plazo venció y
   * devuelve las que cambiaron de estado en esta ejecución (para notificarlas).
   * La búsqueda y actualización van en una transacción para evitar
   * notificaciones duplicadas ante ejecuciones concurrentes.
   */
  async expirarCotizacionesVencidas(
    fechaActual: Date,
  ): Promise<CotizacionConDetalle[]> {
    return this.prisma.$transaction(async (tx) => {
      const vencidas = await tx.cotizacion.findMany({
        where: {
          estado: EstadoCotizacion.COTIZADO,
          fechaExpiracion: {
            lt: fechaActual,
          },
        },
        include: cotizacionInclude,
      });

      if (vencidas.length === 0) {
        return [];
      }

      await tx.cotizacion.updateMany({
        where: {
          idCotizacion: {
            in: vencidas.map((cotizacion) => cotizacion.idCotizacion),
          },
        },
        data: {
          estado: EstadoCotizacion.EXPIRADO,
        },
      });

      return vencidas.map((cotizacion) => ({
        ...cotizacion,
        estado: EstadoCotizacion.EXPIRADO,
      }));
    });
  }
}