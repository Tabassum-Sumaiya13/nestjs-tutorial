import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TenantServiceController {
  @Get('health')
  health() {
    return { ok: true, service: 'tenant-service', mode: 'HTTP' };
  }

  @MessagePattern({ cmd: 'get_tenant' })
  getAuth(@Payload() data: any) {
    return {
      message: '🔑 Tenant Service TCP response',
      receivedData: data ?? null,
      ts: new Date().toISOString(),
    };
  }
}