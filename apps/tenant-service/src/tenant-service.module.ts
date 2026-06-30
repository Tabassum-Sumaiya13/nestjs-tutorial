import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env available everywhere
    }),
  ],
  controllers: [TenantServiceController],
  providers: [TenantServiceService],
})
export class TenantServiceModule {}