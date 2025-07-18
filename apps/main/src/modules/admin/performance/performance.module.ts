import { Module } from '@nestjs/common'
import { PerformanceController } from './performance.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Performance } from '@model/performance/performance.model'
import { sign } from 'crypto'
import { PerformanceService } from './performance.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Performance])],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [],
})
export class PerformanceModule {}
