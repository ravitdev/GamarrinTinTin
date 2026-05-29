// src/app.module.ts
import { Module } from '@nestjs/common';
import { ProductosModule } from './producto.module';

@Module({
  imports: [ProductosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}