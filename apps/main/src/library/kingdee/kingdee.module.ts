import { Module } from '@nestjs/common';
import { KingdeeeService } from './kingdee.service';

@Module({
  imports: [],
  providers: [KingdeeeService],
})
export class KingdeeeModule { }