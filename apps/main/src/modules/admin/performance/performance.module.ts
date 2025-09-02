import { Module } from '@nestjs/common'
import { PerformanceController } from './performance.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { PerformancePrice } from '@model/performance/performancePrice.model'
import { PerformanceService } from './performance.service'
import { RedisModule } from '@library/redis'
import { PerformancePriceDetail } from '@model/index'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([PerformancePrice, PerformancePriceDetail])],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [],
})
export class PerformanceModule {}
