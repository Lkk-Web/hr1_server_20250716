import { Module } from '@nestjs/common'
import { SalesOrderController } from './salesOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { SalesOrderService } from './salesOrder.service'
import { RedisModule } from '@library/redis'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { SalesOrderDetail } from '@model/plan/salesOrderDetail.model'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([SalesOrder, SalesOrderDetail])],
  controllers: [SalesOrderController],
  providers: [SalesOrderService],
  exports: [],
})
export class SalesOrderModule {}
