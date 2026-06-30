import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const logger = new Logger('ApiGateway');
  const port = 3501; // HTTP port
  await app.listen(port);
  logger.log(`🚀 Api-Gateway is running on: http://localhost:${port}`);
}
bootstrap();