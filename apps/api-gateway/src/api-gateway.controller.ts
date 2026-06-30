
import { Controller, Get } from '@nestjs/common';

@Controller()
export class ApiGatewayController {  
  @Get()
  getHello(): any {
    return { message: '🚀 Welcome to Api Gateway!' };
  }
}