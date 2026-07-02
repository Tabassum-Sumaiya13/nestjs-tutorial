import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { TenantGatewayController } from './tenant-gateway.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: '0.0.0.0',
            port: Number(cfg.get('AUTH_SERVICE_TCP_PORT') || 4502),
          },
        }),
      },
      {
        name: 'TENANT_SERVICE',
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: '0.0.0.0',
            port: cfg.get<number>('TENANT_SERVICE_TCP_PORT', 4503),
          },
        }),
      },
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: '0.0.0.0',
            port: Number(cfg.get('USER_SERVICE_TCP_PORT') || 4504),
          },
        }),
      },
      // (You’ll add PRODUCT_SERVICE similarly later)
    ]),
  ],
  controllers: [ApiGatewayController, TenantGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}