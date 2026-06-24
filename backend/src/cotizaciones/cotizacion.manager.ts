import { Inject, Injectable, Optional } from '@nestjs/common';
import { NotificacionManager } from '../notificaciones/notificacion.manager';
import { CotizacionMapper } from './cotizacion.mapper';
import type { CotizacionResponseDto } from './dto/cotizacion-response.dto';
import type { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import type { ResponderCotizacionDto } from './dto/responder-cotizacion.dto';
import type { ICotizacionRepository } from './icotizacion.repository';

const HORAS_VIGENCIA_COTIZACION = 48;

@Injectable()
export class CotizacionManager {
  constructor(
    @Inject('ICotizacionRepository')
    private readonly cotizacionRepository: ICotizacionRepository,
    @Optional()
    private readonly notificacionManager?: NotificacionManager,
  ) {}

  async crearSolicitud(
    idCliente: number,
    datos: CrearCotizacionDto,
  ): Promise<CotizacionResponseDto> {
    this.validarId(idCliente, 'El cliente no es válido.');
    this.validarId(
      datos.idProductoVariante,
      'La variante del producto no es válida.',
    );

    if (!Number.isInteger(datos.cantidad) || datos.cantidad <= 0) {
      throw new Error(
        'La cantidad solicitada debe ser un entero mayor a cero.',
      );
    }

    if (!['PERSONALIZACION', 'STOCK_INSUFICIENTE'].includes(datos.razon)) {
      throw new Error('La razón de la cotización no es válida.');
    }

    const cotizacion = await this.cotizacionRepository.crear(idCliente, datos);
    if (cotizacion.cliente?.email) {
      await this.notificacionManager?.enviarCotizacionCreada(
        cotizacion.cliente.email,
        cotizacion.idCotizacion,
        cotizacion,
      );
    }
    return CotizacionMapper.aResponseDto(cotizacion);
  }

  async listarPorCliente(idCliente: number): Promise<CotizacionResponseDto[]> {
    this.validarId(idCliente, 'El cliente no es válido.');
    await this.cancelarVencidas();

    const cotizaciones =
      await this.cotizacionRepository.listarPorCliente(idCliente);
    return cotizaciones.map((cotizacion) =>
      CotizacionMapper.aResponseDto(cotizacion),
    );
  }

  async consultarPropia(
    idCliente: number,
    idCotizacion: number,
  ): Promise<CotizacionResponseDto> {
    this.validarId(idCliente, 'El cliente no es válido.');
    this.validarId(idCotizacion, 'La cotización no es válida.');
    await this.cancelarVencidas();

    const cotizacion =
      await this.cotizacionRepository.buscarPorId(idCotizacion);

    if (!cotizacion || cotizacion.idCliente !== idCliente) {
      throw new Error('Cotización no encontrada.');
    }

    return CotizacionMapper.aResponseDto(cotizacion);
  }

  async listarSolicitudes(): Promise<CotizacionResponseDto[]> {
    await this.cancelarVencidas();

    const cotizaciones = await this.cotizacionRepository.listarSolicitudes();
    return cotizaciones.map((cotizacion) =>
      CotizacionMapper.aResponseDto(cotizacion),
    );
  }

  async consultarSolicitud(
    idCotizacion: number,
  ): Promise<CotizacionResponseDto> {
    this.validarId(idCotizacion, 'La cotización no es válida.');
    await this.cancelarVencidas();

    const cotizacion =
      await this.cotizacionRepository.buscarPorId(idCotizacion);

    if (!cotizacion) {
      throw new Error('Cotización no encontrada.');
    }

    return CotizacionMapper.aResponseDto(cotizacion);
  }

  async responderCotizacion(
    idCotizacion: number,
    atendidoPorId: number,
    datos: ResponderCotizacionDto,
  ): Promise<CotizacionResponseDto> {
    this.validarId(idCotizacion, 'La cotización no es válida.');
    this.validarId(atendidoPorId, 'El usuario que atiende no es válido.');

    const precioCotizado = datos.precioCotizado ?? datos.precioPropuesto;

    if (
      typeof precioCotizado !== 'number' ||
      !Number.isFinite(precioCotizado) ||
      precioCotizado <= 0
    ) {
      throw new Error('El precio cotizado debe ser mayor a cero.');
    }

    const fechaExpiracion = new Date(
      Date.now() + HORAS_VIGENCIA_COTIZACION * 60 * 60 * 1000,
    );
    const cotizacion = await this.cotizacionRepository.responder(
      idCotizacion,
      atendidoPorId,
      precioCotizado,
      fechaExpiracion,
    );

    if (!cotizacion) {
      const existente =
        await this.cotizacionRepository.buscarPorId(idCotizacion);

      if (!existente) {
        throw new Error('Cotización no encontrada.');
      }

      throw new Error('Solo puede responderse una cotización pendiente.');
    }

    if (cotizacion.cliente?.email) {
      await this.notificacionManager?.enviarEstadoCotizacion(
        cotizacion.cliente.email,
        cotizacion.idCotizacion,
        cotizacion.estado,
        cotizacion.precioCotizado,
        cotizacion.fechaExpiracion,
        cotizacion,
      );
    }

    return CotizacionMapper.aResponseDto(cotizacion);
  }

  async agregarCotizacionAlCarrito(
    idCliente: number,
    idCotizacion: number,
  ): Promise<CotizacionResponseDto> {
    this.validarId(idCliente, 'El cliente no es válido.');
    this.validarId(idCotizacion, 'La cotización no es válida.');
    await this.cancelarVencidas();

    const cotizacion = await this.cotizacionRepository.agregarAlCarrito(
      idCotizacion,
      idCliente,
    );

    if (!cotizacion) {
      throw new Error('Cotización no encontrada.');
    }

    return CotizacionMapper.aResponseDto(cotizacion);
  }

  async cancelarCotizacionPropia(
    idCliente: number,
    idCotizacion: number,
  ): Promise<CotizacionResponseDto> {
    this.validarId(idCliente, 'El cliente no es válido.');
    this.validarId(idCotizacion, 'La cotización no es válida.');

    const cotizacion = await this.cotizacionRepository.cancelarPropia(
      idCotizacion,
      idCliente,
    );

    if (!cotizacion) {
      throw new Error('Cotización no encontrada.');
    }

    if (cotizacion.cliente?.email) {
      await this.notificacionManager?.enviarEstadoCotizacion(
        cotizacion.cliente.email,
        cotizacion.idCotizacion,
        cotizacion.estado,
        cotizacion.precioCotizado,
        cotizacion.fechaExpiracion,
        cotizacion,
      );
    }

    return CotizacionMapper.aResponseDto(cotizacion);
  }

  async cancelarVencidas(): Promise<number> {
    const cotizaciones = await this.cotizacionRepository.cancelarVencidas(
      new Date(),
    );

    await Promise.all(
      cotizaciones.map(async (cotizacion) => {
        if (cotizacion.cliente?.email) {
          await this.notificacionManager?.enviarEstadoCotizacion(
            cotizacion.cliente.email,
            cotizacion.idCotizacion,
            'EXPIRADO',
            cotizacion.precioCotizado,
            cotizacion.fechaExpiracion,
            cotizacion,
          );
        }
      }),
    );

    return cotizaciones.length;
  }

  private validarId(id: number, mensaje: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(mensaje);
    }
  }
}
