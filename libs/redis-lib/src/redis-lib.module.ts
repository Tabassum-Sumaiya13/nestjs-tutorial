import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisLibService } from './redis-lib.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisLibService],
  exports: [RedisLibService],
})
export class RedisLibModule {}