import { Injectable } from '@nestjs/common';
import {
  EstadoPedido as PrismaEstadoPedido,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  EstadoPedido,
  Pedido,
} from './domain/pedido.entity';
import {
  IPedidoRepository,
  PedidoGestionRegistro,
} from './ipedido.repository';
import { PedidoMapper, PedidoRegistro } from './pedido.mapper';

const pedidoGestionInclude = {
  cliente: {
    select: {
      idUsuario: true,
      nombres: true,
      apellidos: true,
      email: true,
      telefono: true,
      tipoDocumento: true,
      numeroDocumento: true,
      direccion: true,
    },
  },
  detalles: {
    include: {
      productoVariante: {
        select: {
          colorHex: true,
        },
      },
    },
  },
} satisfies Prisma.PedidoInclude;

type PedidoGestionPrismaRegistro = Prisma.PedidoGetPayload<{
  include: typeof pedidoGestionInclude;
}>;

@Injectable()
export class PedidoRepository implements IPedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(pedido: Pedido): Promise<Pedido> {
    if (pedido.idPedido > 0) {
      const registro = await this.prisma.pedido.update({
        where: { idPedido: pedido.idPedido },
        data: {
          estado: pedido.estado,
          tipoEntrega: pedido.tipoEntrega,
          direccionSnapshot: pedido.direccionSnapshot,
          subtotal: pedido.subtotal,
          descuentoTotal: pedido.descuentoTotal,
          total: pedido.total,
        },
        include: { detalles: true },
      });

      return PedidoMapper.aEntidad(registro);
    }

    const cliente = await this.prisma.usuario.findUnique({
      where: { idUsuario: pedido.idCliente },
      select: { idUsuario: true },
    });

    if (!cliente) {
      throw new Error('Cliente no encontrado para el pedido.');
    }

    const detallesPreparados = await Promise.all(
      pedido.detalles.map(async (detalle) => {
        const variante = await this.prisma.productoVariante.findUnique({
          where: { idProductoVariante: detalle.idProductoVariante },
          include: {
            producto: {
              include: {
                descuentosVolumen: {
                  where: {
                    esActivo: true,
                    fechaEliminacion: null,
                  },
                  orderBy: {
                    cantidadMinima: 'desc',
                  },
                },
              },
            },
          },
        });

        if (!variante || !variante.esActivo || !variante.producto.esActivo) {
          throw new Error('Producto no disponible para el pedido.');
        }

        let precioUnitario = variante.producto.precioBase.toNumber();
        let nombreProductoSnapshot = variante.producto.nombre;
        let colorSnapshot = variante.colorNombre;
        let tallaSnapshot = variante.talla;

        if (detalle.idCotizacion !== null) {
          const cotizacion = await this.prisma.cotizacion.findFirst({
            where: {
              idCotizacion: detalle.idCotizacion,
              idCliente: pedido.idCliente,
              idProductoVariante: detalle.idProductoVariante,
              estado: 'COTIZADO',
              fechaExpiracion: {
                gt: new Date(),
              },
            },
          });

          if (!cotizacion || cotizacion.precioCotizado === null) {
            throw new Error(
              'La cotización no está disponible para generar el pedido.',
            );
          }

          if (detalle.cantidad !== cotizacion.cantidad) {
            throw new Error(
              'La cantidad del pedido debe coincidir con la cotización.',
            );
          }

          precioUnitario = cotizacion.precioCotizado.toNumber();
          nombreProductoSnapshot = cotizacion.nombreProductoSnapshot;
          colorSnapshot = cotizacion.colorSnapshot;
          tallaSnapshot = cotizacion.tallaSnapshot;
        }

        const subtotal = precioUnitario * detalle.cantidad;

        return {
          idProducto: variante.idProducto,
          idProductoVariante: detalle.idProductoVariante,
          idCotizacion: detalle.idCotizacion,
          cantidad: detalle.cantidad,
          precioUnitario,
          subtotal,
          nombreProductoSnapshot,
          colorSnapshot,
          tallaSnapshot,
          descuentosVolumen: variante.producto.descuentosVolumen.map(
            (descuento) => ({
              cantidadMinima: descuento.cantidadMinima,
              porcentajeDescuento:
                descuento.porcentajeDescuento.toNumber(),
            }),
          ),
        };
      }),
    );

    const subtotal = detallesPreparados.reduce(
      (acumulado, detalle) => acumulado + detalle.subtotal,
      0,
    );

    const cantidadesPorProducto = detallesPreparados.reduce<
      Record<number, number>
    >((cantidades, detalle) => {
      if (detalle.idCotizacion !== null) {
        return cantidades;
      }

      cantidades[detalle.idProducto] =
        (cantidades[detalle.idProducto] ?? 0) + detalle.cantidad;
      return cantidades;
    }, {});

    const descuentoTotal = this.redondearMoneda(
      detallesPreparados.reduce((acumulado, detalle) => {
        if (detalle.idCotizacion !== null) {
          return acumulado;
        }

        const cantidadProducto = cantidadesPorProducto[detalle.idProducto] ?? 0;
        const descuentoAplicable = detalle.descuentosVolumen.find(
          (descuento) => cantidadProducto >= descuento.cantidadMinima,
        );
        const porcentajeDescuento =
          descuentoAplicable?.porcentajeDescuento ?? 0;

        return acumulado + detalle.subtotal * (porcentajeDescuento / 100);
      }, 0),
    );
    const total = subtotal - descuentoTotal;

    const detallesParaCrear = detallesPreparados.map(
      ({ idProducto: _idProducto, descuentosVolumen: _descuentos, ...detalle }) =>
        detalle,
    );

    const registro = await this.prisma.pedido.create({
      data: {
        idCliente: pedido.idCliente,
        estado: pedido.estado,
        subtotal,
        descuentoTotal,
        total,
        tipoEntrega: pedido.tipoEntrega,
        direccionSnapshot: pedido.direccionSnapshot,
        detalles: {
          create: detallesParaCrear,
        },
      },
      include: { detalles: true },
    });

    return PedidoMapper.aEntidad(registro);
  }

  async registrarPago(
    idPedido: number,
    monto: number,
    pagoExitoso: boolean,
    referenciaExterna: string,
  ): Promise<boolean> {
    await this.prisma.$transaction(async (tx) => {
      await tx.pago.create({
        data: {
          idPedido,
          monto,
          metodoPago: 'TARJETA',
          estado: pagoExitoso ? 'PAGADO' : 'FALLO',
          referenciaExterna,
          fechaPago: pagoExitoso ? new Date() : null,
        },
      });

      if (!pagoExitoso) {
        return;
      }

      const detallesCotizados = await tx.pedidoDetalle.findMany({
        where: {
          idPedido,
          idCotizacion: {
            not: null,
          },
        },
        select: {
          idCotizacion: true,
        },
      });
      const idsCotizaciones = detallesCotizados
        .map((detalle) => detalle.idCotizacion)
        .filter(
          (idCotizacion): idCotizacion is number => idCotizacion !== null,
        );

      if (idsCotizaciones.length > 0) {
        await tx.cotizacion.updateMany({
          where: {
            idCotizacion: {
              in: idsCotizaciones,
            },
          },
          data: {
            estado: 'PAGADO',
          },
        });

        await tx.itemCarrito.deleteMany({
          where: {
            idCotizacion: {
              in: idsCotizaciones,
            },
          },
        });
      }
    });

    return true;
  }

  async buscarPorId(idPedido: number): Promise<Pedido | null> {
    const registro = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: { detalles: true },
    });

    return registro ? PedidoMapper.aEntidad(registro) : null;
  }

  async listarPorCliente(idCliente: number): Promise<Pedido[]> {
    const registros = await this.prisma.pedido.findMany({
      where: { idCliente },
      include: { detalles: true },
      orderBy: { fechaCreacion: 'desc' },
    });

    return registros.map((registro) =>
      PedidoMapper.aEntidad(registro as PedidoRegistro),
    );
  }

  async listarTodos(): Promise<Pedido[]> {
    const registros = await this.prisma.pedido.findMany({
      include: { detalles: true },
      orderBy: { fechaCreacion: 'desc' },
    });

    return registros.map((registro) => PedidoMapper.aEntidad(registro));
  }

  async listarParaPersonal(
    estado?: EstadoPedido,
  ): Promise<PedidoGestionRegistro[]> {
    const registros = await this.prisma.pedido.findMany({
      where: estado ? { estado: estado as PrismaEstadoPedido } : undefined,
      include: pedidoGestionInclude,
      orderBy: { fechaCreacion: 'desc' },
    });

    return registros.map((registro) => this.aGestionRegistro(registro));
  }

  async buscarGestionPorId(
    idPedido: number,
  ): Promise<PedidoGestionRegistro | null> {
    const registro = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: pedidoGestionInclude,
    });

    return registro ? this.aGestionRegistro(registro) : null;
  }

  async actualizarEstado(
    idPedido: number,
    estado: EstadoPedido,
  ): Promise<PedidoGestionRegistro> {
    const registro = await this.prisma.pedido.update({
      where: { idPedido },
      data: {
        estado: estado as PrismaEstadoPedido,
      },
      include: pedidoGestionInclude,
    });

    return this.aGestionRegistro(registro);
  }

  private aGestionRegistro(
    registro: PedidoGestionPrismaRegistro,
  ): PedidoGestionRegistro {
    return {
      idPedido: registro.idPedido,
      idCliente: registro.idCliente,
      cliente: {
        idUsuario: registro.cliente.idUsuario,
        nombres: registro.cliente.nombres,
        apellidos: registro.cliente.apellidos,
        email: registro.cliente.email,
        telefono: registro.cliente.telefono,
        tipoDocumento: registro.cliente.tipoDocumento,
        numeroDocumento: registro.cliente.numeroDocumento,
        direccion: registro.cliente.direccion,
      },
      fechaCreacion: registro.fechaCreacion,
      fechaActualizacion: registro.fechaActualizacion,
      estado: registro.estado,
      subtotal: this.aNumero(registro.subtotal),
      descuentoTotal: this.aNumero(registro.descuentoTotal),
      total: this.aNumero(registro.total),
      tipoEntrega: registro.tipoEntrega,
      direccionSnapshot: registro.direccionSnapshot,
      detalles: registro.detalles.map((detalle) => ({
        idPedidoDetalle: detalle.idPedidoDetalle,
        idProductoVariante: detalle.idProductoVariante,
        idCotizacion: detalle.idCotizacion,
        cantidad: detalle.cantidad,
        precioUnitario: this.aNumero(detalle.precioUnitario),
        subtotal: this.aNumero(detalle.subtotal),
        nombreProductoSnapshot: detalle.nombreProductoSnapshot,
        colorSnapshot: detalle.colorSnapshot,
        colorHex: detalle.productoVariante.colorHex,
        tallaSnapshot: detalle.tallaSnapshot,
      })),
    };
  }

  private aNumero(valor: number | { toNumber(): number }): number {
    return typeof valor === 'number' ? valor : valor.toNumber();
  }

  private redondearMoneda(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }
}
