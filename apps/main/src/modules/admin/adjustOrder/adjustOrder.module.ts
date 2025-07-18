import { Module } from '@nestjs/common'
import { AdjustOrderController } from './adjustOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { AdjustOrder } from '@model/warehouse/adjustOrder.model'
import { sign } from 'crypto'
import { AdjustOrderService } from './adjustOrder.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([AdjustOrder])],
  controllers: [AdjustOrderController],
  providers: [AdjustOrderService],
  exports: [],
})
export class AdjustOrderModule {}
