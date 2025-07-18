import { Module } from '@nestjs/common'
import { MaintenancePlanController } from './maintenancePlan.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { MaintenancePlanService } from './maintenancePlan.service'
import { RedisModule } from '@library/redis'
import { MaintenancePlan } from '@model/equipment/maintenancePlan.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([MaintenancePlan])],
  controllers: [MaintenancePlanController],
  providers: [MaintenancePlanService],
  exports: [],
})
export class MaintenancePlanModule {}
