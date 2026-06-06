import { Injectable } from '@nestjs/common';
import { Usuario } from './domain/usuario.entity';
import { IUsuarioRepository } from './iusuario.repository';
import { ContrasenaService } from './seguridad/contrasena.service';
import { UsuarioDataMapper, UsuarioRegistro } from './usuario-data.mapper';

@Injectable()
export class UsuarioRepository implements IUsuarioRepository {
  private usuariosTable: UsuarioRegistro[];
  private readonly usuarioDataMap = new UsuarioDataMapper();

  constructor(private readonly contrasenaService: ContrasenaService) {
    const fechaRegistro = new Date('2026-06-01T00:00:00.000Z');

    this.usuariosTable = [
      {
        idUsuario: 1,
        nombres: 'Cliente',
        apellidos: 'Demo',
        email: 'cliente@gamarrintintin.com',
        contrasenaHash: this.contrasenaService.generarHash('Cliente123'),
        telefono: '999111222',
        fechaRegistro,
        dniRuc: '70000001',
        direccion: 'Lima',
        rol: 'CLIENTE',
        estado: 'ACTIVO',
      },
      {
        idUsuario: 2,
        nombres: 'Vendedor',
        apellidos: 'Demo',
        email: 'vendedor@gamarrintintin.com',
        contrasenaHash: this.contrasenaService.generarHash('Vendedor123'),
        telefono: '999222333',
        fechaRegistro,
        dniRuc: '70000002',
        direccion: 'Gamarra',
        rol: 'VENDEDOR',
        estado: 'ACTIVO',
      },
      {
        idUsuario: 3,
        nombres: 'Administrador',
        apellidos: 'Demo',
        email: 'admin@gamarrintintin.com',
        contrasenaHash: this.contrasenaService.generarHash('Admin123'),
        telefono: '999333444',
        fechaRegistro,
        dniRuc: '70000003',
        direccion: 'Gamarra',
        rol: 'ADMINISTRADOR',
        estado: 'ACTIVO',
      },
      {
        idUsuario: 4,
        nombres: 'Cuenta',
        apellidos: 'Inactiva',
        email: 'inactivo@gamarrintintin.com',
        contrasenaHash: this.contrasenaService.generarHash('Inactivo123'),
        telefono: '999444555',
        fechaRegistro,
        dniRuc: '70000004',
        direccion: 'Lima',
        rol: 'CLIENTE',
        estado: 'INACTIVO',
      },
    ];
  }

  async guardar(usuario: Usuario): Promise<boolean> {
    return this.usuarioDataMap.insertar(usuario, this.usuariosTable);
  }

  async actualizar(usuario: Usuario): Promise<boolean> {
    return this.usuarioDataMap.actualizar(usuario, this.usuariosTable);
  }

  async desactivar(idUsuario: number): Promise<boolean> {
    return this.usuarioDataMap.desactivar(idUsuario, this.usuariosTable);
  }

  async buscarPorId(idUsuario: number): Promise<Usuario | null> {
    return this.usuarioDataMap.seleccionarPorId(idUsuario, this.usuariosTable);
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarioDataMap.seleccionarPorEmail(email, this.usuariosTable);
  }

  async existePorEmail(email: string): Promise<boolean> {
    return this.usuarioDataMap.existePorEmail(email, this.usuariosTable);
  }

  async existePorDocumento(dniRuc: string): Promise<boolean> {
    return this.usuarioDataMap.existePorDocumento(dniRuc, this.usuariosTable);
  }

  async listarUsuarios(): Promise<Usuario[]> {
    return this.usuarioDataMap.seleccionarTodos(this.usuariosTable);
  }
}
