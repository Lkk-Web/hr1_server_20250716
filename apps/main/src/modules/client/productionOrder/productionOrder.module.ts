import { Module } from '@nestjs/common'
import { ProductionOrderController } from './productionOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionOrder } from '@model/pe/productionOrder.model'
import { ProductionOrderService } from './productionOrder.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionOrder])],
  controllers: [ProductionOrderController],
  providers: [ProductionOrderService],
  exports: [],
})
export class ProductionOrderModule {}
