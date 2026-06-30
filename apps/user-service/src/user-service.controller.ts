import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class UserServiceController {
  // 🚪 DOOR 1: HTTP Health Check
  @Get('health')
  health() {
    return { ok: true, service: 'user-service', mode: 'HTTP' };
  }

  // 🚪 DOOR 2: TCP Message Handler
  @MessagePattern({ cmd: 'get_user' })
  getUser(@Payload() data: any) {
    return {
      message: '👤 User Service TCP response',
      receivedData: data ?? null,
      ts: new Date().toISOString(),
    };
  }
}