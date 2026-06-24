import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CotizacionManager } from './cotizacion.manager';

/**
 * Representa al actor "Tiempo" del caso de uso 3.1.5.6 (Cancelar cotización por
 * vencimiento de plazo): ejecuta periódicamente el barrido de cotizaciones
 * cotizadas cuyo plazo de respuesta venció, marcándolas como vencidas y
 * notificando al cliente por correo.
 */
@Injectable()
export class CotizacionScheduler {
  private readonly logger = new Logger(CotizacionScheduler.name);

  constructor(private readonly cotizacionManager: CotizacionManager) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cancelarCotizacionesVencidas(): Promise<void> {
    try {
      const canceladas = await this.cotizacionManager.procesarVencimientos();

      if (canceladas > 0) {
        this.logger.log(
          `Cotizaciones canceladas por vencimiento de plazo: ${canceladas}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(
        `Fallo al procesar el vencimiento de cotizaciones: ${message}`,
      );
    }
  }
}
