import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { DashboardService } from './dashboard.service'
import { RedisModule } from '@library/redis'
import { DashboardController } from './dashboard.controller'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionOrderTask])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [],
})
export class DashboardModule {}
