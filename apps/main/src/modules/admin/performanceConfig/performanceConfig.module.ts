import { Module } from '@nestjs/common'
import { PerformanceConfigController } from './performanceConfig.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { PerformanceConfigService } from './performanceConfig.service'
import { RedisModule } from '@library/redis'
import { PerformanceConfig } from '@model/index'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([PerformanceConfig])],
  controllers: [PerformanceConfigController],
  providers: [PerformanceConfigService],
  exports: [],
})
export class PerformanceConfigModule {}
