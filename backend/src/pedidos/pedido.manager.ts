import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EstadoPedido,
  Pedido,
  PedidoDetalle,
} from './domain/pedido.entity';
import type { CrearPedidoDetalleDto } from './dto/crear-pedido.dto';
import type {
  IPedidoRepository,
  PedidoGestionRegistro,
} from './ipedido.repository';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class PedidoManager {
  private readonly logger = new Logger(PedidoManager.name);

  constructor(
    @Inject('IPedidoRepository')
    private readonly pedidoRepo: IPedidoRepository,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async crearPedido(
    idCliente: number,
    items: CrearPedidoDetalleDto[],
    tipoEntrega: 'ENVIO' | 'RECOJO_TIENDA',
    direccionEnvio?: string | null,
  ): Promise<Pedido> {
    if (!this.esEnteroPositivo(idCliente)) {
      throw new Error('El cliente del pedido no es válido.');
    }

    if (!items || items.length === 0) {
      throw new Error('El pedido debe tener al menos un detalle.');
    }

    if (!['ENVIO', 'RECOJO_TIENDA'].includes(tipoEntrega)) {
      throw new Error('El tipo de entrega no es válido.');
    }

    const direccionNormalizada = direccionEnvio?.trim() ?? '';

    if (tipoEntrega === 'ENVIO' && !direccionNormalizada) {
      throw new Error('La dirección de envío es obligatoria.');
    }

    const direccionSnapshot =
      tipoEntrega === 'ENVIO'
        ? direccionNormalizada
        : 'Recojo en tienda';

    const detalles = items.map((item) => this.crearDetalle(item));
    const subtotal = detalles.reduce(
      (acumulado, detalle) => acumulado + detalle.calcularSubtotal(),
      0,
    );
    const descuentoTotal = 0;
    const total = subtotal - descuentoTotal;

    const pedido = new Pedido(
      0,
      idCliente,
      new Date(),
      'REGISTRADO',
      subtotal,
      descuentoTotal,
      total,
      tipoEntrega,
      direccionSnapshot,
      detalles,
    );

    return this.pedidoRepo.guardar(pedido);
  }

  async procesarPagoPedido(
    idPedido: number,
    tokenTarjeta: string,
  ): Promise<boolean> {
    if (!this.esEnteroPositivo(idPedido)) {
      throw new Error('El pedido no es válido.');
    }

    const tokenPago = tokenTarjeta?.trim();

    if (!tokenPago) {
      throw new Error('El token de pago es obligatorio.');
    }

    const pedido = await this.pedidoRepo.buscarPorId(idPedido);

    if (!pedido) {
      throw new Error('Pedido no encontrado.');
    }

    if (pedido.estado !== 'REGISTRADO') {
      throw new Error('El pedido no se encuentra pendiente de pago.');
    }

    const pagoExitoso = this.simularPago(tokenPago);

    await this.pedidoRepo.registrarPago(
      idPedido,
      pedido.total,
      pagoExitoso,
      tokenPago,
    );

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
    if (!this.esEnteroPositivo(idCliente)) {
      throw new Error('El cliente del pedido no es válido.');
    }

    await this.consultarDetallePedidoPropio(idCliente, idPedido);
    return this.procesarPagoPedido(idPedido, tokenTarjeta);
  }

  async listarPorCliente(idCliente: number): Promise<Pedido[]> {
    if (!this.esEnteroPositivo(idCliente)) {
      throw new Error('El cliente del pedido no es válido.');
    }

    return this.pedidoRepo.listarPorCliente(idCliente);
  }

  async consultarDetallePedidoPropio(
    idCliente: number,
    idPedido: number,
  ): Promise<Pedido> {
    if (!this.esEnteroPositivo(idCliente)) {
      throw new Error('El cliente del pedido no es válido.');
    }

    if (!this.esEnteroPositivo(idPedido)) {
      throw new Error('El pedido no es válido.');
    }

    const pedido = await this.pedidoRepo.buscarPorId(idPedido);

    if (!pedido || pedido.idCliente !== idCliente) {
      throw new Error('Pedido no encontrado para el cliente.');
    }

    return pedido;
  }

  async listarParaPersonal(
    estado?: EstadoPedido,
  ): Promise<PedidoGestionRegistro[]> {
    if (estado !== undefined) {
      this.validarEstadoPedido(estado);
    }

    return this.pedidoRepo.listarParaPersonal(estado);
  }

  async consultarDetalleParaPersonal(
    idPedido: number,
  ): Promise<PedidoGestionRegistro> {
    if (!this.esEnteroPositivo(idPedido)) {
      throw new Error('El pedido no es válido.');
    }

    const pedido = await this.pedidoRepo.buscarGestionPorId(idPedido);

    if (!pedido) {
      throw new Error('El pedido no se encuentra disponible.');
    }

    return pedido;
  }

  async actualizarEstadoParaPersonal(
    idPedido: number,
    nuevoEstado: EstadoPedido,
  ): Promise<PedidoGestionRegistro> {
    if (!this.esEnteroPositivo(idPedido)) {
      throw new Error('El pedido no es válido.');
    }

    this.validarEstadoPedido(nuevoEstado);

    const pedido = await this.pedidoRepo.buscarGestionPorId(idPedido);

    if (!pedido) {
      throw new Error('El pedido no se encuentra disponible.');
    }

    const actualizado = await this.pedidoRepo.actualizarEstado(
      idPedido,
      nuevoEstado,
    );

    await this.notificarEstadoPedidoActualizado(actualizado);

    return actualizado;
  }

  private async notificarEstadoPedidoActualizado(
    pedido: PedidoGestionRegistro,
  ): Promise<void> {
    try {
      await this.notificacionesService.enviarEstadoPedidoActualizado({
        email: pedido.cliente.email,
        nombres: pedido.cliente.nombres,
        codigoPedido: this.generarCodigoPedido(pedido.idPedido),
        estado: pedido.estado,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';

      this.logger.warn(
        `No se pudo enviar correo de actualización de pedido ${this.generarCodigoPedido(
          pedido.idPedido,
        )}: ${message}`,
      );
    }
  }

  private generarCodigoPedido(idPedido: number): string {
    return `PED-${String(idPedido).padStart(6, '0')}`;
  }

  private crearDetalle(item: CrearPedidoDetalleDto): PedidoDetalle {
    if (!item || typeof item !== 'object') {
      throw new Error('El detalle del pedido no es válido.');
    }

    if (!this.esEnteroPositivo(item.idProductoVariante)) {
      throw new Error('La variante del producto no es válida.');
    }

    if (!this.esEnteroPositivo(item.cantidad)) {
      throw new Error('La cantidad del detalle no es válida.');
    }

    if (item.idCotizacion !== undefined && item.idCotizacion !== null) {
      if (!this.esEnteroPositivo(item.idCotizacion)) {
        throw new Error('La cotizacion del detalle no es válida.');
      }
    }

    return new PedidoDetalle(
      0,
      item.idProductoVariante,
      item.idCotizacion ?? null,
      item.cantidad,
      0,
      0,
      '',
      '',
      'M',
    );
  }

  private validarEstadoPedido(estado: EstadoPedido): void {
    const estadosPermitidos: EstadoPedido[] = [
      'REGISTRADO',
      'CONFIRMADO',
      'PROCESANDO',
      'ENVIADO',
      'ENTREGADO',
      'CANCELADO',
    ];

    if (!estadosPermitidos.includes(estado)) {
      throw new Error('El estado del pedido no es válido.');
    }
  }

  private simularPago(tokenTarjeta: string): boolean {
    const tokenNormalizado = tokenTarjeta?.trim().toLowerCase();
    return Boolean(tokenNormalizado && tokenNormalizado !== 'rechazado');
  }

  private esEnteroPositivo(valor: number): boolean {
    return Number.isInteger(valor) && valor > 0;
  }
}