import { Usuario } from './domain/usuario.entity';
import { UsuarioSesionDto } from './dto/sesion.dto';
import type { PedidoClienteResumenDto, UsuarioPerfilDto } from './dto/perfil.dto';
import type { SolicitudCambioDocumentoDto } from './dto/solicitud-cambio-documento.dto';
import type { SolicitudDesactivacionDto } from './dto/solicitud-desactivacion.dto';

export class UsuarioMapper {
  static aSesionDto(usuario: Usuario): UsuarioSesionDto {
    return {
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
    };
  }

  static aPerfilDto(
    usuario: Usuario,
    extras: {
      solicitudCambioDocumentoPendiente: boolean;
      solicitudDesactivacionPendiente: boolean;
      puedeDesactivarse: boolean;
      motivoNoDesactivacion?: string;
      totalPedidos?: number;
      totalGastado?: number;
      fechaUltimoPedido?: string | null;
      pedidos?: PedidoClienteResumenDto[];
    },
  ): UsuarioPerfilDto {
    return {
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      telefono: usuario.telefono,
      tipoDocumento: usuario.tipoDocumento,
      numeroDocumento: usuario.numeroDocumento,
      direccion: usuario.direccion,
      rol: usuario.rol,
      estado: usuario.estado,
      fechaRegistro: usuario.fechaRegistro.toISOString(),
      solicitudCambioDocumentoPendiente: extras.solicitudCambioDocumentoPendiente,
      solicitudDesactivacionPendiente: extras.solicitudDesactivacionPendiente,
      puedeDesactivarse: extras.puedeDesactivarse,
      motivoNoDesactivacion: extras.motivoNoDesactivacion,
      totalPedidos: extras.totalPedidos,
      totalGastado: extras.totalGastado,
      fechaUltimoPedido: extras.fechaUltimoPedido,
      pedidos: extras.pedidos,
    };
  }

  static aSolicitudCambioDocumentoDto(
    solicitud: {
      idSolicitud: number;
      tipoDocumento: Usuario['tipoDocumento'];
      numeroDocumento: string;
      estado: string;
      fechaSolicitud: Date;
    },
    usuario: Usuario,
  ): SolicitudCambioDocumentoDto {
    return {
      idSolicitud: solicitud.idSolicitud,
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
      tipoDocumentoActual: usuario.tipoDocumento,
      numeroDocumentoActual: usuario.numeroDocumento,
      tipoDocumentoNuevo: solicitud.tipoDocumento,
      numeroDocumentoNuevo: solicitud.numeroDocumento,
      estado: solicitud.estado,
      fechaSolicitud: solicitud.fechaSolicitud.toISOString(),
    };
  }

  static aSolicitudDesactivacionDto(
    solicitud: {
      idSolicitud: number;
      estado: string;
      fechaSolicitud: Date;
    },
    usuario: Usuario,
    puedeDesactivarse: boolean,
    motivoNoDesactivacion?: string,
  ): SolicitudDesactivacionDto {
    return {
      idSolicitud: solicitud.idSolicitud,
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol,
      estado: solicitud.estado,
      fechaSolicitud: solicitud.fechaSolicitud.toISOString(),
      puedeDesactivarse,
      motivoNoDesactivacion,
    };
  }
}
