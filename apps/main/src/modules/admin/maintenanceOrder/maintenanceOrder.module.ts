import { Module } from '@nestjs/common'
import { MaintenanceOrderController } from './maintenanceOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { MaintenanceOrderService } from './maintenanceOrder.service'
import { RedisModule } from '@library/redis'
import { MaintenanceOrder } from '@model/equipment/maintenanceOrder.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([MaintenanceOrder])],
  controllers: [MaintenanceOrderController],
  providers: [MaintenanceOrderService],
  exports: [],
})
export class MaintenanceOrderModule {}
