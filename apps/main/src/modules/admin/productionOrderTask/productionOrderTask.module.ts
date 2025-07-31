import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { ProductionOrderTaskController } from './productionOrderTask.controller'
import { ProductionOrderTaskService } from './productionOrderTask.service'

@Module({
  imports: [SequelizeModule.forFeature([ProductionOrderTask])],
  controllers: [ProductionOrderTaskController],
  providers: [ProductionOrderTaskService],
  exports: [ProductionOrderTaskService],
})
export class ProductionOrderTaskModule {}