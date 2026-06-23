import {
  EstadoPedido,
  Pedido,
  Talla,
  TipoEntrega,
} from './domain/pedido.entity';

export interface PedidoGestionClienteRegistro {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: string;
  numeroDocumento: string;
  direccion: string | null;
}

export interface PedidoGestionDetalleRegistro {
  idPedidoDetalle: number;
  idProductoVariante: number;
  idCotizacion: number | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  nombreProductoSnapshot: string;
  colorSnapshot: string;
  colorHex: string;
  tallaSnapshot: Talla;
}

export interface PedidoGestionRegistro {
  idPedido: number;
  idCliente: number;
  cliente: PedidoGestionClienteRegistro;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  estado: EstadoPedido;
  subtotal: number;
  descuentoTotal: number;
  total: number;
  tipoEntrega: TipoEntrega;
  direccionSnapshot: string;
  detalles: PedidoGestionDetalleRegistro[];
}

export interface IPedidoRepository {
  guardar(pedido: Pedido): Promise<Pedido>;

  registrarPago(
    idPedido: number,
    monto: number,
    pagoExitoso: boolean,
    referenciaExterna: string,
  ): Promise<boolean>;

  buscarPorId(idPedido: number): Promise<Pedido | null>;

  listarPorCliente(idCliente: number): Promise<Pedido[]>;

  listarParaPersonal(estado?: EstadoPedido): Promise<PedidoGestionRegistro[]>;

  buscarGestionPorId(idPedido: number): Promise<PedidoGestionRegistro | null>;

  actualizarEstado(
    idPedido: number,
    estado: EstadoPedido,
  ): Promise<PedidoGestionRegistro>;
}