import { Injectable } from '@nestjs/common';
import {
  EstadoCotizacion,
  LadoProducto,
  RazonCotizacion,
} from '@prisma/client';
import {
  CotizacionConDetalle,
  CotizacionRepository,
} from './cotizacion.repository';
import { SolicitarCotizacionDto } from './dto/solicitar-cotizacion.dto';
import { ResponderCotizacionDto } from './dto/responder-cotizacion.dto';

interface UsuarioAutenticado {
  idUsuario: number;
  email: string;
  rol: string;
}

export interface CotizacionResponseDto {
  id: number;
  idCotizacion: number;
  codigo: string;
  cliente: {
    nombres: string;
    apellidos: string;
    correo: string;
    celular: string;
    tipoDocumento: string;
    documento: string;
    direccion: string;
  };
  producto: {
    id: number;
    nombre: string;
    precio: number;
    descripcion: string;
    categoria: string;
    descuentosVolumen: Array<{
      cantidadMinima: number;
      porcentajeDescuento: number;
    }>;
  };
  colorSeleccionado: {
    nombre: string;
    hexCode: string;
  };
  tallaSeleccionada: string;
  cantidad: number;
  estado: 'pendiente' | 'cotizado' | 'pagado' | 'rechazado' | 'vencido';
  createdAt: Date;
  updatedAt: Date;
  precioSugerido?: number;
  fechaVencimiento?: Date;
  disenoPecho?: string | null;
  disenoEspalda?: string | null;
}

@Injectable()
export class CotizacionManager {
  constructor(private readonly cotizacionRepository: CotizacionRepository) {}

  async solicitar(
    usuario: UsuarioAutenticado,
    dto: SolicitarCotizacionDto,
  ): Promise<CotizacionResponseDto> {
    this.validarCliente(usuario);
    this.validarSolicitud(dto);

    const variante = await this.cotizacionRepository.buscarProductoVariante(
      dto.idProductoVariante,
    );

    if (!variante) {
      throw new Error('La variante seleccionada no existe.');
    }

    if (!variante.esActivo) {
      throw new Error('La variante seleccionada no está disponible.');
    }

    const imagenes = dto.personalizacion?.imagenes ?? [];

    const cotizacion = await this.cotizacionRepository.crear({
      cliente: {
        connect: {
          idUsuario: usuario.idUsuario,
        },
      },
      productoVariante: {
        connect: {
          idProductoVariante: dto.idProductoVariante,
        },
      },
      cantidad: dto.cantidad,
      razon: dto.razon as RazonCotizacion,
      estado: EstadoCotizacion.PENDIENTE,
      nombreProductoSnapshot: variante.producto.nombre,
      colorSnapshot: variante.colorNombre,
      tallaSnapshot: variante.talla,
      precioBaseSnapshot: variante.producto.precioBase,
      ...(imagenes.length > 0
        ? {
            personalizacion: {
              create: {
                imagenes: {
                  create: imagenes.map((imagen, index) => ({
                    idDisenoPredefinido:
                      imagen.idDisenoPredefinido ?? undefined,
                    urlImagen: imagen.urlImagen,
                    lado: imagen.lado as LadoProducto,
                    xPosicion: imagen.xPosicion,
                    yPosicion: imagen.yPosicion,
                    anchoPorcentaje: imagen.anchoPorcentaje,
                    altoPorcentaje: imagen.altoPorcentaje,
                    displayOrder: imagen.displayOrder ?? index,
                  })),
                },
              },
            },
          }
        : {}),
    });

    return this.aResponseDto(cotizacion);
  }

  async listarMisCotizaciones(
    usuario: UsuarioAutenticado,
  ): Promise<CotizacionResponseDto[]> {
    this.validarCliente(usuario);
    await this.cotizacionRepository.expirarCotizacionesVencidas(new Date());

    const cotizaciones = await this.cotizacionRepository.listarPorCliente(
      usuario.idUsuario,
    );

    return cotizaciones.map((cotizacion) => this.aResponseDto(cotizacion));
  }

  async listarTodas(
    usuario: UsuarioAutenticado,
  ): Promise<CotizacionResponseDto[]> {
    this.validarPersonalNegocio(usuario);
    await this.cotizacionRepository.expirarCotizacionesVencidas(new Date());

    const cotizaciones = await this.cotizacionRepository.listarTodas();

    return cotizaciones.map((cotizacion) => this.aResponseDto(cotizacion));
  }

  async consultarDetalle(
    usuario: UsuarioAutenticado,
    idCotizacion: number,
  ): Promise<CotizacionResponseDto> {
    await this.cotizacionRepository.expirarCotizacionesVencidas(new Date());

    const cotizacion = await this.cotizacionRepository.buscarPorId(idCotizacion);

    if (!cotizacion) {
      throw new Error('Cotización no encontrada.');
    }

    const esClientePropietario =
      usuario.rol === 'CLIENTE' && cotizacion.idCliente === usuario.idUsuario;

    const esPersonalNegocio =
      usuario.rol === 'VENDEDOR' || usuario.rol === 'ADMINISTRADOR';

    if (!esClientePropietario && !esPersonalNegocio) {
      throw new Error('No tienes permiso para ver esta cotización.');
    }

    return this.aResponseDto(cotizacion);
  }

  async responder(
    usuario: UsuarioAutenticado,
    idCotizacion: number,
    dto: ResponderCotizacionDto,
  ): Promise<CotizacionResponseDto> {
    this.validarPersonalNegocio(usuario);
    this.validarPrecio(dto.precioPropuesto);

    const cotizacion = await this.cotizacionRepository.buscarPorId(idCotizacion);

    if (!cotizacion) {
      throw new Error('Cotización no encontrada.');
    }

    if (cotizacion.estado !== EstadoCotizacion.PENDIENTE) {
      throw new Error(
        'La cotización no se encuentra en estado pendiente y no puede ser atendida.',
      );
    }

    const fechaCotizacion = new Date();
    const fechaExpiracion = new Date(
      fechaCotizacion.getTime() + 48 * 60 * 60 * 1000,
    );

    const actualizada = await this.cotizacionRepository.responder({
      idCotizacion,
      atendidoPorId: usuario.idUsuario,
      precioPropuesto: dto.precioPropuesto,
      fechaCotizacion,
      fechaExpiracion,
    });

    return this.aResponseDto(actualizada);
  }

  private validarSolicitud(dto: SolicitarCotizacionDto): void {
    if (!Number.isInteger(dto.idProductoVariante) || dto.idProductoVariante <= 0) {
      throw new Error('La variante seleccionada no es válida.');
    }

    if (!Number.isInteger(dto.cantidad) || dto.cantidad <= 0) {
      throw new Error('Debe ingresar una cantidad válida.');
    }

    const razonesPermitidas = [
      RazonCotizacion.PERSONALIZACION,
      RazonCotizacion.STOCK_INSUFICIENTE,
    ];

    if (!razonesPermitidas.includes(dto.razon as RazonCotizacion)) {
      throw new Error('La razón de cotización no es válida.');
    }
  }

  private validarPrecio(precio: number): void {
    if (typeof precio !== 'number' || Number.isNaN(precio) || precio <= 0) {
      throw new Error('El precio ingresado no es válido.');
    }
  }

  private validarCliente(usuario: UsuarioAutenticado): void {
    if (usuario.rol !== 'CLIENTE') {
      throw new Error('Solo los clientes pueden realizar esta operación.');
    }
  }

  private validarPersonalNegocio(usuario: UsuarioAutenticado): void {
    if (usuario.rol !== 'VENDEDOR' && usuario.rol !== 'ADMINISTRADOR') {
      throw new Error('No tienes permiso para realizar esta operación.');
    }
  }

  private aResponseDto(cotizacion: CotizacionConDetalle): CotizacionResponseDto {
    const imagenes = cotizacion.personalizacion?.imagenes ?? [];

    const disenoPecho =
      imagenes
        .filter((imagen) => imagen.lado === LadoProducto.FRONT)
        .map((imagen) => imagen.disenoPredefinido?.nombre ?? imagen.urlImagen)
        .join(', ') || null;

    const disenoEspalda =
      imagenes
        .filter((imagen) => imagen.lado === LadoProducto.BACK)
        .map((imagen) => imagen.disenoPredefinido?.nombre ?? imagen.urlImagen)
        .join(', ') || null;

    return {
      id: cotizacion.idCotizacion,
      idCotizacion: cotizacion.idCotizacion,
      codigo: this.generarCodigo(cotizacion.idCotizacion),
      cliente: {
        nombres: cotizacion.cliente.nombres,
        apellidos: cotizacion.cliente.apellidos,
        correo: cotizacion.cliente.email,
        celular: cotizacion.cliente.telefono,
        tipoDocumento: cotizacion.cliente.tipoDocumento,
        documento: cotizacion.cliente.numeroDocumento,
        direccion: cotizacion.cliente.direccion ?? '',
      },
      producto: {
        id: cotizacion.productoVariante.producto.idProducto,
        nombre: cotizacion.nombreProductoSnapshot,
        precio: Number(cotizacion.precioBaseSnapshot),
        descripcion: cotizacion.productoVariante.producto.descripcion,
        categoria: 'Prenda',
        descuentosVolumen:
          cotizacion.productoVariante.producto.descuentosVolumen.map(
            (descuento) => ({
              cantidadMinima: descuento.cantidadMinima,
              porcentajeDescuento: Number(descuento.porcentajeDescuento),
            }),
          ),
      },
      colorSeleccionado: {
        nombre: cotizacion.colorSnapshot,
        hexCode: cotizacion.productoVariante.colorHex,
      },
      tallaSeleccionada: cotizacion.tallaSnapshot,
      cantidad: cotizacion.cantidad,
      estado: this.mapearEstado(cotizacion.estado),
      createdAt: cotizacion.fechaCreacion,
      updatedAt: cotizacion.fechaActualizacion,
      precioSugerido: cotizacion.precioCotizado
        ? Number(cotizacion.precioCotizado)
        : undefined,
      fechaVencimiento: cotizacion.fechaExpiracion ?? undefined,
      disenoPecho,
      disenoEspalda,
    };
  }

  private generarCodigo(idCotizacion: number): string {
    return `COT-${String(idCotizacion).padStart(6, '0')}`;
  }

  private mapearEstado(
    estado: EstadoCotizacion,
  ): 'pendiente' | 'cotizado' | 'pagado' | 'rechazado' | 'vencido' {
    const mapping = {
      [EstadoCotizacion.PENDIENTE]: 'pendiente',
      [EstadoCotizacion.COTIZADO]: 'cotizado',
      [EstadoCotizacion.PAGADO]: 'pagado',
      [EstadoCotizacion.RECHAZADO]: 'rechazado',
      [EstadoCotizacion.EXPIRADO]: 'vencido',
    } as const;

    return mapping[estado];
  }
}