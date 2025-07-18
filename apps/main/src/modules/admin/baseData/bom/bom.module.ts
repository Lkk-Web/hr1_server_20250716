import { Module } from '@nestjs/common'
import { BomController } from './bom.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { BomService } from './bom.service'
import { RedisModule } from '@library/redis'
import { BOM } from '@model/base/bom.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([BOM])],
  controllers: [BomController],
  providers: [BomService],
  exports: [BomService],
})
export class BomModule {}
