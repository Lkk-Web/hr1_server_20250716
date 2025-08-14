import { Module } from '@nestjs/common'
import { KingdeeeService } from './kingdee.service'

@Module({
  imports: [],
  providers: [KingdeeeService],
  exports: [KingdeeeService],
})
export class KingdeeeModule {}
