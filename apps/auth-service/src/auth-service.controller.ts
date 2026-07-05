import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthServiceController {
  constructor(private readonly service: AuthServiceService) {}

  // ───────────────────────────────
  // HTTP Endpoint: Signup
  // ───────────────────────────────
  @Post('signup')
  async signupHttp(@Req() req: any, @Body() dto: SignupDto) {
    const result = await this.service.signup(req, dto);
    return result;
  }

  // ───────────────────────────────
  // TCP Endpoint: Signup
  // ───────────────────────────────
  @MessagePattern({ cmd: 'auth.signup' })
  async signupTcp(@Payload() payload: SignupDto & { tenantConnection?: any }) {
    const result = await this.service.signup(
      { tenantConnection: payload.tenantConnection },
      payload,
    );
    return result;
  }

  // ───────────────────────────────
  // HTTP Endpoint: Health check
  // ───────────────────────────────
  @Get('health')
  health() {
    return { ok: true, service: 'auth-service', mode: 'HTTP' };
  }
}
