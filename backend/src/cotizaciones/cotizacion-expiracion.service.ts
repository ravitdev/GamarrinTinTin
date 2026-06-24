import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { CotizacionManager } from './cotizacion.manager';

@Injectable()
export class CotizacionExpiracionService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(CotizacionExpiracionService.name);
  private temporizador?: NodeJS.Timeout;

  constructor(private readonly cotizacionManager: CotizacionManager) {}

  onApplicationBootstrap(): void {
    this.temporizador = setInterval(() => {
      void this.cotizacionManager.cancelarVencidas().catch((error: unknown) => {
        const mensaje =
          error instanceof Error ? error.message : 'Error desconocido';
        this.logger.error(
          `No se pudieron procesar las cotizaciones vencidas: ${mensaje}`,
        );
      });
    }, 60_000);
    this.temporizador.unref();
  }

  onApplicationShutdown(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
  }
}
