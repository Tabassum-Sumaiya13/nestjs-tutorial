import { Module } from '@nestjs/common';
import { RedisLibService } from './redis-lib.service';

@Module({
  providers: [RedisLibService],
  exports: [RedisLibService],
})
export class RedisLibModule {}
