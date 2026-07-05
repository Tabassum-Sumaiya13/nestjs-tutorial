import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AuthServiceModule } from '../../auth-service/src/auth-service.module';

const serviceName = 'auth-service';

async function bootstrap() {
  const ENV_PREFIX = serviceName.toUpperCase().replace(/-/g, '_');
  const httpPort = Number(process.env[`${ENV_PREFIX}_HTTP_PORT`]) || 3502;
  const tcpPort = Number(process.env[`${ENV_PREFIX}_TCP_PORT`]) || 4502;

  console.log(`${ENV_PREFIX}_HTTP_PORT`);

  // Create HTTP app
  const app = await NestFactory.create(AuthServiceModule);

  // Attach TCP microservice
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
      `    TCP : tcp://localhost:${tcpPort}\n` +
      `    ENV : ${process.env.NODE_ENV}`,
  );
}
bootstrap();
