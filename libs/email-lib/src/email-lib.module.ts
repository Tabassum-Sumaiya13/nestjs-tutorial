import { Module } from '@nestjs/common';
import { EmailLibService } from './email-lib.service';

@Module({
  providers: [EmailLibService],
  exports: [EmailLibService],
})
export class EmailLibModule {}
