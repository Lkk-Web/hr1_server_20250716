import { Module } from '@nestjs/common'
import { BomController } from './bom.controller'
import { BomService } from './bom.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule],
  controllers: [BomController],
  providers: [BomService],
  exports: [],
})
export class BomModule { }
