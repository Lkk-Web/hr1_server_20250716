import { Module } from '@nestjs/common'
import { ProcessTaskController } from './processTask.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProcessTask } from '@model/pe/processTask.model'
import { ProcessTaskService } from './processTask.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProcessTask])],
  controllers: [ProcessTaskController],
  providers: [ProcessTaskService],
  exports: [],
})
export class ProcessTaskModule {}
