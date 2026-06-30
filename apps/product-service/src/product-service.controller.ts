import { Controller, Get } from '@nestjs/common';
import { ProductServiceService } from './product-service.service';
import { get } from 'http';

@Controller()
export class ProductServiceController {
  @Get()
  getHello(): any {
    return { message: '🚀 Welcome to Product Service!(TCP)' };
  } 
}
