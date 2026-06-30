import { Controller, Get } from '@nestjs/common';
import { TenantServiceService } from './tenant-service.service';

@Controller()
export class TenantServiceController {
  @Get()
  getHello(): any {
    return { message: '🚀 Welcome to Tenant Service!(TCP)' };
  } 
}
