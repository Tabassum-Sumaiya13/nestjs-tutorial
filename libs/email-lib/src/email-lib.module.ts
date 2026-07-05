import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailLibService } from './email-lib.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailLibService],
  exports: [EmailLibService],
})
export class EmailLibModule {}