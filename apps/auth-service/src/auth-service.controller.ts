import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AuthServiceController {
  @Get('health')
  health() {
    return { ok: true, service: 'auth-service', mode: 'HTTP' };
  }

  @MessagePattern({ cmd: 'get_auth' })
  getAuth(@Payload() data: any) {
    return {
      message: '🔑 Auth Service TCP response',
      receivedData: data ?? null,
      ts: new Date().toISOString(),
    };
  }
}