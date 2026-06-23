import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Pedido } from './domain/pedido.entity';
import { IPedidoRepository } from './ipedido.repository';
import { PedidoMapper, PedidoRegistro } from './pedido.mapper';

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
          include: { producto: true },
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
          idProductoVariante: detalle.idProductoVariante,
          idCotizacion: detalle.idCotizacion,
          cantidad: detalle.cantidad,
          precioUnitario,
          subtotal,
          nombreProductoSnapshot,
          colorSnapshot,
          tallaSnapshot,
        };
      }),
    );
    const subtotal = detallesPreparados.reduce(
      (acumulado, detalle) => acumulado + detalle.subtotal,
      0,
    );
    const descuentoTotal = pedido.descuentoTotal;
    const total = subtotal - descuentoTotal;

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
          create: detallesPreparados,
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
}
