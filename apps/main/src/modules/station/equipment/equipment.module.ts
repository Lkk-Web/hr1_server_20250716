import { Module } from '@nestjs/common'
import { EquipmentController } from './equipment.controller'
import { EquipmentService } from './equipment.service'
import { RedisModule } from '@library/redis'
import { MaintenanceOrderService } from '@modules/admin/maintenanceOrder/maintenanceOrder.service'

@Module({
  imports: [
    RedisModule,
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService,MaintenanceOrderService],
  exports: [],
})
export class EquipmentModule {}
