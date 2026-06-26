import type { EstadoUsuario, RolUsuario, TipoDocumento } from '../domain/usuario.entity';
import type { EstadoPedido } from '../../pedidos/domain/pedido.entity';

export interface PedidoClienteResumenDto {
  idPedido: number;
  codigo: string;
  fecha: string;
  estado: EstadoPedido;
  total: number;
  items: number;
  productos: string[];
}

export interface UsuarioPerfilDto {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  direccion: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  fechaRegistro: string;
  solicitudCambioDocumentoPendiente: boolean;
  solicitudDesactivacionPendiente: boolean;
  puedeDesactivarse: boolean;
  motivoNoDesactivacion?: string;
  totalPedidos?: number;
  totalGastado?: number;
  fechaUltimoPedido?: string | null;
  pedidos?: PedidoClienteResumenDto[];
}

export interface ActualizarPerfilDto {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  direccion?: string | null;
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
}

export interface CambiarContrasenaDto {
  contrasenaActual: string;
  contrasenaNueva: string;
}
