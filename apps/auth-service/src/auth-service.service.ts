import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisLibModule } from '@app/redis-lib';
import { DatabaseLibService } from '@app/database-lib';
import { TenantMiddleware } from '@app/database-lib/tenant.middleware';
import { AuthServiceService } from './auth-service.service';
import { EmailLibService } from '@app/email-lib';
import { AuthServiceController } from './auth-service.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisLibModule,
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService, DatabaseLibService, EmailLibService],
})
export class AuthServiceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
