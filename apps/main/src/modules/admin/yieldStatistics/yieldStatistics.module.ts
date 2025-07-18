import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { RedisModule } from '@library/redis'
import { ProductionOrder } from '@model/index'
import { YieldStatisticsController } from './yieldStatistics.controller'
import { YieldStatisticsService } from './yieldStatistics.service'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionOrder])],
  controllers: [YieldStatisticsController],
  providers: [YieldStatisticsService],
  exports: [],
})
export class YieldStatisticsModule {}
