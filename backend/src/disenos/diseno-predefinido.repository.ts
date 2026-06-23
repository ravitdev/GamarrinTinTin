import { Injectable } from '@nestjs/common';
import { DisenoPredefinido } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DisenoPredefinidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarActivos(): Promise<DisenoPredefinido[]> {
    return this.prisma.disenoPredefinido.findMany({
      where: {
        esActivo: true,
        fechaEliminacion: null,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });
  }

  async buscarActivoPorId(
    idDisenoPredefinido: number,
  ): Promise<DisenoPredefinido | null> {
    return this.prisma.disenoPredefinido.findFirst({
      where: {
        idDisenoPredefinido,
        esActivo: true,
        fechaEliminacion: null,
      },
    });
  }

  async buscarActivoPorNombre(
    nombre: string,
  ): Promise<DisenoPredefinido | null> {
    return this.prisma.disenoPredefinido.findFirst({
      where: {
        nombre,
        esActivo: true,
        fechaEliminacion: null,
      },
    });
  }

  async registrar(datos: {
    creadoPorId: number;
    nombre: string;
    urlImagen: string;
  }): Promise<DisenoPredefinido> {
    return this.prisma.disenoPredefinido.create({
      data: {
        creadoPorId: datos.creadoPorId,
        nombre: datos.nombre,
        urlImagen: datos.urlImagen,
      },
    });
  }

  async desactivar(
    idDisenoPredefinido: number,
  ): Promise<DisenoPredefinido> {
    return this.prisma.disenoPredefinido.update({
      where: {
        idDisenoPredefinido,
      },
      data: {
        esActivo: false,
        fechaEliminacion: new Date(),
      },
    });
  }
}