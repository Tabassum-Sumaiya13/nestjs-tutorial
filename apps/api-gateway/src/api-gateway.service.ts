import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor() {
    this.logger.log(`Loaded env: ${process.env.NODE_ENV}`);
  }

  getHello(): any {
    return { message: '🚀 Welcome to Api Gateway!' };
  }
}