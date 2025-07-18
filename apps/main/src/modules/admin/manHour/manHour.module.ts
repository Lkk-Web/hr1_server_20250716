import { Module } from '@nestjs/common'
import { ManHourController } from './manHour.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { ManHourService } from './manHour.service'
import { RedisModule } from '@library/redis'
import { PerformanceConfig } from '@model/index'
@Module({
  imports: [RedisModule],
  controllers: [ManHourController],
  providers: [ManHourService],
  exports: [],
})
export class ManHourModule {}
