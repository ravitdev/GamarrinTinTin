import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly puedeConectar: boolean;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    super({
      adapter: new PrismaPg({
        connectionString:
          connectionString ??
          'postgresql://usuario:contrasena@localhost:5432/gamarrintintin',
      }),
    });

    this.puedeConectar = Boolean(connectionString);
  }

  async onModuleInit() {
    if (!this.puedeConectar) {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (!this.puedeConectar) {
      return;
    }

    await this.$disconnect();
  }
}
