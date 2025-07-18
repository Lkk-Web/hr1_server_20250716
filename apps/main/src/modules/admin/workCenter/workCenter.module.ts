import { Module } from '@nestjs/common'
import { RedisModule } from '@library/redis'
import { WorkCenter } from '@model/base/workCenter.model'
import { WorkCenterController } from './workCenter.controller'
import { WorkCenterService } from './workCenter.service'
import { SequelizeModule } from '@nestjs/sequelize'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([WorkCenter])],
  controllers: [WorkCenterController],
  providers: [WorkCenterService],
  exports: [],
})
export class WorkCenterModule {}
