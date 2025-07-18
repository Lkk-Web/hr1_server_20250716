import { Module } from '@nestjs/common'
import { SchedulePlanController } from './schedulePlan.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { SchedulePlan } from '@model/schedule/schedulePlan.model'
import { sign } from 'crypto'
import { SchedulePlanService } from './schedulePlan.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([SchedulePlan])],
  controllers: [SchedulePlanController],
  providers: [SchedulePlanService],
  exports: [],
})
export class SchedulePlanModule {}
