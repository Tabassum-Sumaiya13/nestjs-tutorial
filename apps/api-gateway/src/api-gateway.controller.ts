import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, throwError } from 'rxjs';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject( 'AUTH_SERVICE' ) private readonly authClient: ClientProxy,
    @Inject( 'TENANT_SERVICE' ) private readonly tenantClient: ClientProxy,
     @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get('/')
  async root() {
    const obs$ = this.authClient
      .send({ cmd: 'get_auth' }, { via: 'gateway', at: new Date().toISOString() })
      .pipe(
        timeout(2000),
        catchError((err) =>
          throwError(() => new Error(`Auth service error: ${err?.message || err}`)),
        ),
      );

    const response = await lastValueFrom(obs$);
    return response;
  }
   @Get('/tenant')
  async getTenant() {
    const obs$ = this.tenantClient
      .send({ cmd: 'get_tenant' }, { via: 'gateway', from: 'tanent-route', at: new Date().toISOString() })
      .pipe(
        timeout(2000),
        catchError((err) =>
          throwError(() => new Error(`Tenant service error: ${err?.message || err}`)),
        ),
      );

    const response = await lastValueFrom(obs$);
    return response;
  }

  @Get('/user')
  async getUser() {
    const obs$ = this.userClient
      .send({ cmd: 'get_user' }, { via: 'gateway', from: 'user-route', at: new Date().toISOString() })
      .pipe(
        timeout(2000),
        catchError((err) =>
          throwError(() => new Error(`User service error: ${err?.message || err}`)),
        ),
      );

    const response = await lastValueFrom(obs$);
    return response;
  }

  @Get('/health')
  health() {
    return { ok: true, service: 'api-gateway', mode: 'HTTP' };
  }
}