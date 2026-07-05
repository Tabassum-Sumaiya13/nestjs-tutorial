import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { RedisLibModule } from '@app/redis-lib';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // DB connection
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        uri:
          cfg.get<string>('MONGO_URI_TENANT') ??
          cfg.get<string>('MONGO_URI', 'mongodb://localhost:27017'),
      }),
      inject: [ConfigService],
    }),

    // Register Tenant schema
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),

    // Redis Caching
    RedisLibModule,
  ],
  controllers: [TenantServiceController],
  providers: [TenantServiceService],
})
export class TenantServiceModule {}