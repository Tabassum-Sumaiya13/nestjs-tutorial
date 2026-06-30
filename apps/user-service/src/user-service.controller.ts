import { Controller, Get } from '@nestjs/common';
import { UserServiceService } from './user-service.service';

@Controller()
export class UserServiceController {
  @Get()
  getHello(): any {
    return { message: '🚀 Welcome to User Service!(TCP)' };
  } 
}
