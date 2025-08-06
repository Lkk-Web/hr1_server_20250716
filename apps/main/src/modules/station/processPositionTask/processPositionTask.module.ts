import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProcessPositionTaskController } from './processPositionTask.controller'
import { ProcessPositionTaskService } from './processPositionTask.service'
import { ProcessPositionTask } from '@model/production/processPositionTask.model'
import { ProcessTask } from '@model/production/processTask.model'
import { User } from '@model/auth/user'
import { Team } from '@model/auth/team'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProductionOrderTaskTeam } from '@model/production/productionOrderTaskOfTeam.model'
import { ProductSerial } from '@model/production/productSerial.model'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ProcessPositionTask, 
      ProcessTask, 
      User, 
      Team, 
      ProductionOrderTask, 
      ProductionOrderTaskTeam, 
      ProductSerial
    ])
  ],
  controllers: [ProcessPositionTaskController],
  providers: [ProcessPositionTaskService],
  exports: [ProcessPositionTaskService]
})
export class ProcessPositionTaskModule {}