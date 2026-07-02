import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TenantServiceModule } from './tenant-service.module';

async function bootstrap() {
  const serviceName = 'tenant-service';
  const ENV_PREFIX = serviceName.toUpperCase().replace(/-/g, '_');
  const httpPort = Number(process.env[`${ENV_PREFIX}_HTTP_PORT`]) || 3503;
  const tcpPort = Number(process.env[`${ENV_PREFIX}_TCP_PORT`]) || 4503;

  const app = await NestFactory.create(TenantServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: tcpPort },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);

  const logger = new Logger(serviceName);
  logger.log(
    `\n🚀  ${serviceName} ready!\n` +
      `    REST: http://localhost:${httpPort}\n` +
      `    TCP : tcp://localhost:${tcpPort}\n`,
  );
}
bootstrap();