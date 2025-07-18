import { Module } from '@nestjs/common'
import { CheckStandardController } from './checkStandard.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { CheckStandardService } from './checkStandard.service'
import { RedisModule } from '@library/redis'
import { CheckStandard } from '@model/equipment/checkStandard.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([CheckStandard])],
  controllers: [CheckStandardController],
  providers: [CheckStandardService],
  exports: [],
})
export class CheckStandardModule {}
