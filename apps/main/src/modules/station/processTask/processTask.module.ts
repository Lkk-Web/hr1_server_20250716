import { Module } from '@nestjs/common'
import { ProcessTaskController } from './processTask.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionProcessTask } from '@model/production/productionProcessTask.model'
import { ProcessTaskService } from './processTask.service'
import { RedisModule } from '@library/redis'
import { NotifyService } from '@modules/admin/notify/notify.service'
import { BomModule } from '@modules/admin/baseData/bom/bom.module'

@Module({
  imports: [RedisModule, BomModule, SequelizeModule.forFeature([ProductionProcessTask])],
  controllers: [ProcessTaskController],
  providers: [ProcessTaskService, NotifyService],
  exports: [],
})
export class ProcessTaskModule {}
