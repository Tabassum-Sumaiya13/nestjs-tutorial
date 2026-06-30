
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthServiceController {
  @MessagePattern('getWelcome')  
  getWelcome(): any {
    return { message: '🔑 Welcome to Auth Service (TCP)!' };
  }
}