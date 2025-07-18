import { Module } from '@nestjs/common'
import { InspectionOrderController } from './inspectionOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { InspectionOrderService } from './inspectionOrder.service'
import { RedisModule } from '@library/redis'
import { InspectionOrder } from '@model/equipment/inspectionOrder.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([InspectionOrder])],
  controllers: [InspectionOrderController],
  providers: [InspectionOrderService],
  exports: [],
})
export class InspectionOrderModule {}
