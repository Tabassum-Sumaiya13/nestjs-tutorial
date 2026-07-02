import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';
import { Tenant, TenantSchema } from './schemas/tenant.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // DB connection
    MongooseModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGO_URI_TENANT'),
      }),
      inject: [ConfigService],
    }),

    // Register Tenant schema
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
  ],
  controllers: [TenantServiceController],
  providers: [TenantServiceService],
})
export class TenantServiceModule {}