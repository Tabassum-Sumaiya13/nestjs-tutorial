// auth-service.controller.ts
import { Body, Controller, Post, Req } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { apiResponse } from '@app/common-lib';
import { AuthServiceService } from './auth-service.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SignupDto } from './dto/signup.dto'; // Make sure to import this

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
  // HTTP Endpoint: Login (send OTP)
  // ───────────────────────────────
  @Post('login')
  async loginHttp(@Req() req: any, @Body() dto: LoginDto) {
    const result = await this.service.login(req, dto);
    return result;
  }

  // ───────────────────────────────
  // HTTP Endpoint: Login → Verify OTP
  // ───────────────────────────────
  @Post('login/verify')
  async verifyOtpHttp(@Req() req: any, @Body() dto: VerifyOtpDto) {
    const result = await this.service.verifyOtp(req, dto);
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
  // TCP Endpoint: Login (send OTP)
  // ───────────────────────────────
  @MessagePattern({ cmd: 'auth.login' })
  async loginTcp(@Payload() payload: LoginDto & { tenantConnection?: any }) {
    const result = await this.service.login(
      { tenantConnection: payload.tenantConnection },
      payload,
    );
    return result;
  }

  // ───────────────────────────────
  // TCP Endpoint: Login → Verify OTP
  // ───────────────────────────────
  @MessagePattern({ cmd: 'auth.verifyOtp' })
  async verifyOtpTcp(
    @Payload() payload: VerifyOtpDto & { tenantConnection?: any },
  ) {
    const result = await this.service.verifyOtp(
      { tenantConnection: payload.tenantConnection },
      payload,
    );
    return result;
  }
}