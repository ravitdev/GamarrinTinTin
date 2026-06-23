import { Injectable } from '@nestjs/common';
import { DisenoPredefinido } from '@prisma/client';
import { StorageService, type UploadedFile } from '../modules/storage/storage.service';
import { DisenoPredefinidoResponseDto } from './dto/diseno-predefinido-response.dto';
import { DisenoPredefinidoRepository } from './diseno-predefinido.repository';

@Injectable()
export class DisenoPredefinidoManager {
  constructor(
    private readonly disenoPredefinidoRepository: DisenoPredefinidoRepository,
  ) {}

  async listarActivos(): Promise<DisenoPredefinidoResponseDto[]> {
    const disenos = await this.disenoPredefinidoRepository.listarActivos();

    return disenos.map((diseno) => this.aResponseDto(diseno));
  }

  async registrar(datos: {
    nombre: string;
    file: UploadedFile | undefined;
    creadoPorId: number;
  }): Promise<DisenoPredefinidoResponseDto> {
    const nombreNormalizado = this.normalizarNombre(datos.nombre);

    this.validarNombre(nombreNormalizado);
    this.validarArchivo(datos.file);

    const existente =
      await this.disenoPredefinidoRepository.buscarActivoPorNombre(
        nombreNormalizado,
      );

    if (existente) {
      throw new Error('Ya existe un estampado con ese nombre.');
    }

    const timestamp = Date.now();
    const nombreArchivo = this.normalizarNombreArchivo(
      datos.file!.originalname,
    );
    const key = `designs/predefined/${timestamp}-${nombreArchivo}`;

    const uploadedKey = await StorageService.uploadFile(datos.file!, key);

    const diseno = await this.disenoPredefinidoRepository.registrar({
      creadoPorId: datos.creadoPorId,
      nombre: nombreNormalizado,
      urlImagen: uploadedKey,
    });

    return this.aResponseDto(diseno);
  }

  async desactivar(
    idDisenoPredefinido: number,
  ): Promise<DisenoPredefinidoResponseDto> {
    this.validarId(idDisenoPredefinido);

    const diseno =
      await this.disenoPredefinidoRepository.buscarActivoPorId(
        idDisenoPredefinido,
      );

    if (!diseno) {
      throw new Error('Diseño predefinido no encontrado.');
    }

    const disenoDesactivado =
      await this.disenoPredefinidoRepository.desactivar(
        idDisenoPredefinido,
      );

    return this.aResponseDto(disenoDesactivado);
  }

  private aResponseDto(
    diseno: DisenoPredefinido,
  ): DisenoPredefinidoResponseDto {
    return {
      idDisenoPredefinido: diseno.idDisenoPredefinido,
      creadoPorId: diseno.creadoPorId,
      nombre: diseno.nombre,
      urlImagen: StorageService.getPublicUrl(diseno.urlImagen),
      esActivo: diseno.esActivo,
      fechaCreacion: diseno.fechaCreacion,
      fechaActualizacion: diseno.fechaActualizacion,
    };
  }

  private validarId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('El diseño predefinido no es válido.');
    }
  }

  private validarNombre(nombre: string): void {
    if (!nombre || nombre.length < 2) {
      throw new Error('El nombre del diseño es obligatorio.');
    }

    if (nombre.length > 100) {
      throw new Error('El nombre del diseño no debe superar los 100 caracteres.');
    }
  }

  private validarArchivo(file: UploadedFile | undefined): void {
    if (!file) {
      throw new Error('Debe adjuntar una imagen.');
    }

    const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg'];

    if (!formatosPermitidos.includes(file.mimetype)) {
      throw new Error('Solo se permiten imágenes PNG o JPG.');
    }

    const maxSizeInBytes = 2 * 1024 * 1024;

    if (file.size !== undefined && file.size > maxSizeInBytes) {
      throw new Error('La imagen no debe superar los 2MB.');
    }
  }

  private normalizarNombre(valor: string): string {
    return valor.trim().replace(/\s+/g, ' ');
  }

  private normalizarNombreArchivo(nombreArchivo: string): string {
    const nombreSeguro = nombreArchivo
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '');

    return nombreSeguro || 'diseno-predefinido';
  }
}