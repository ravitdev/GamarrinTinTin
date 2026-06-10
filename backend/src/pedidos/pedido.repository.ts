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
          total: pedido.total,
        },
        include: { detalles: true },
      });

      return PedidoMapper.aEntidad(registro as PedidoRegistro);
    }

    const registro = await this.prisma.pedido.create({
      data: {
        idCliente: pedido.idCliente,
        fecha: pedido.fecha,
        estado: pedido.estado,
        total: pedido.total,
        detalles: {
          create: pedido.detalles.map((detalle) => ({
            idProducto: detalle.idProducto,
            talla: detalle.talla,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
          })),
        },
      },
      include: { detalles: true },
    });

    return PedidoMapper.aEntidad(registro as PedidoRegistro);
  }

  async buscarPorId(idPedido: number): Promise<Pedido | null> {
    const registro = await this.prisma.pedido.findUnique({
      where: { idPedido },
      include: { detalles: true },
    });

    return registro ? PedidoMapper.aEntidad(registro as PedidoRegistro) : null;
  }

  async listarPorCliente(idCliente: number): Promise<Pedido[]> {
    const registros = await this.prisma.pedido.findMany({
      where: { idCliente },
      include: { detalles: true },
      orderBy: { fecha: 'desc' },
    });

    return registros.map((registro) =>
      PedidoMapper.aEntidad(registro as PedidoRegistro),
    );
  }
}
