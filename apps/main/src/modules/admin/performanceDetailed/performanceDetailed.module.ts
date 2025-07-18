import { Module } from '@nestjs/common'
import { PerformanceDetailedController } from './performanceDetailed.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { PerformanceDetailedService } from './performanceDetailed.service'
import { RedisModule } from '@library/redis'
import { PerformanceDetailed } from '@model/index'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([PerformanceDetailed])],
  controllers: [PerformanceDetailedController],
  providers: [PerformanceDetailedService],
  exports: [],
})
export class PerformanceDetailedModule {}
