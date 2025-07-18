import { forwardRef, Module } from '@nestjs/common'
import { OutboundOrderController } from './outboundOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'
import { sign } from 'crypto'
import { OutboundOrderService } from './outboundOrder.service'
import { RedisModule } from '@library/redis'
import { BatchLogModule } from '../batchLog/batchLog.module'
import { BatchLogService } from '../batchLog/batchLog.service'

@Module({
  imports: [RedisModule, forwardRef(() => BatchLogModule), SequelizeModule.forFeature([OutboundOrder])],
  controllers: [OutboundOrderController],
  providers: [OutboundOrderService, BatchLogService],
  exports: [],
})
export class OutboundOrderModule {}
