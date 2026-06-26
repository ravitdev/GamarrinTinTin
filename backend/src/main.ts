// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import storageRoutes from "./modules/storage/storage.routes";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.use("/storage", storageRoutes);
  
  await app.listen(3000);
  console.log('--- 🚀 API RUNNING ON http://localhost:3000 ---');
}
bootstrap();