import { Module } from '@nestjs/common'
import { ProcessTaskController } from './processTask.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionProcessTask } from '@model/production/productionProcessTask.model'
import { sign } from 'crypto'
import { ProcessTaskService } from './processTask.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionProcessTask])],
  controllers: [ProcessTaskController],
  providers: [ProcessTaskService],
  exports: [],
})
export class ProcessTaskModule {}
