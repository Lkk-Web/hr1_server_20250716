import { Module } from '@nestjs/common'
import { ProductionOrderController } from './productionOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { sign } from 'crypto'
import { ProductionOrderService } from './productionOrder.service'
import { RedisModule } from '@library/redis'
import { POB, POBD } from '@model/index'
import { BomModule } from '../baseData/bom/bom.module'
@Module({
  imports: [RedisModule, BomModule, SequelizeModule.forFeature([ProductionOrder, POB, POBD])],
  controllers: [ProductionOrderController],
  providers: [ProductionOrderService],
  exports: [],
})
export class ProductionOrderModule {}
