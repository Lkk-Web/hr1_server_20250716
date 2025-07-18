import { Module } from '@nestjs/common'
import { ProductionOrderController } from './productionOrder.controller'
import { ProductionOrderService } from './productionOrder.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule],
  controllers: [ProductionOrderController],
  providers: [ProductionOrderService],
  exports: [],
})
export class ProductionOrderModule { }
