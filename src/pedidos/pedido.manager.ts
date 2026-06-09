import { Inject, Injectable } from '@nestjs/common';
import { Pedido, PedidoDetalle } from './domain/pedido.entity';
import type { CrearPedidoDetalleDto } from './dto/crear-pedido.dto';
import type { IPedidoRepository } from './ipedido.repository';

@Injectable()
export class PedidoManager {
  constructor(
    @Inject('IPedidoRepository')
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async crearPedido(
    idCliente: number,
    items: CrearPedidoDetalleDto[],
  ): Promise<Pedido[]> {
    if (!idCliente || idCliente <= 0) {
      throw new Error('El cliente del pedido no es válido.');
    }

    if (!items || items.length === 0) {
      throw new Error('El pedido debe tener al menos un detalle.');
    }

    const detalles = items.map((item) => this.crearDetalle(item));
    const total = detalles.reduce(
      (acumulado, detalle) => acumulado + detalle.calcularSubtotal(),
      0,
    );

    const pedido = new Pedido(
      0,
      idCliente,
      new Date(),
      'REGISTRADO',
      total,
      detalles,
    );

    await this.pedidoRepo.guardar(pedido);
    return this.pedidoRepo.listarPorCliente(idCliente);
  }

  async procesarPagoPedido(
    idPedido: number,
    tokenTarjeta: string,
  ): Promise<boolean> {
    const pedido = await this.pedidoRepo.buscarPorId(idPedido);

    if (!pedido) {
      throw new Error('Pedido no encontrado.');
    }

    if (pedido.estado !== 'REGISTRADO') {
      throw new Error('El pedido no se encuentra pendiente de pago.');
    }

    const pagoExitoso = this.simularPago(tokenTarjeta);

    if (!pagoExitoso) {
      return false;
    }

    pedido.estado = 'CONFIRMADO';
    await this.pedidoRepo.guardar(pedido);
    return true;
  }

  async procesarPagoPedidoPropio(
    idCliente: number,
    idPedido: number,
    tokenTarjeta: string,
  ): Promise<boolean> {
    await this.consultarDetallePedidoPropio(idCliente, idPedido);
    return this.procesarPagoPedido(idPedido, tokenTarjeta);
  }

  async listarPorCliente(idCliente: number): Promise<Pedido[]> {
    return this.pedidoRepo.listarPorCliente(idCliente);
  }

  async consultarDetallePedidoPropio(
    idCliente: number,
    idPedido: number,
  ): Promise<Pedido> {
    const pedido = await this.pedidoRepo.buscarPorId(idPedido);

    if (!pedido || pedido.idCliente !== idCliente) {
      throw new Error('Pedido no encontrado para el cliente.');
    }

    return pedido;
  }

  private crearDetalle(item: CrearPedidoDetalleDto): PedidoDetalle {
    if (!item.idProducto || item.idProducto <= 0) {
      throw new Error('El producto del detalle no es válido.');
    }

    if (!['S', 'M', 'L', 'XL'].includes(item.talla)) {
      throw new Error('La talla del detalle no es válida.');
    }

    if (!item.cantidad || item.cantidad <= 0) {
      throw new Error('La cantidad del detalle no es válida.');
    }

    if (!item.precioUnitario || item.precioUnitario <= 0) {
      throw new Error('El precio unitario del detalle no es válido.');
    }

    return new PedidoDetalle(
      0,
      item.idProducto,
      item.talla,
      item.cantidad,
      item.precioUnitario,
    );
  }

  private simularPago(tokenTarjeta: string): boolean {
    const tokenNormalizado = tokenTarjeta?.trim().toLowerCase();
    return Boolean(tokenNormalizado && tokenNormalizado !== 'rechazado');
  }
}
