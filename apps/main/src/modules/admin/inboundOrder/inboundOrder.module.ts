import { forwardRef, Module } from '@nestjs/common'
import { InboundOrderController } from './inboundOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { InboundOrderService } from './inboundOrder.service'
import { RedisModule } from '@library/redis'
import { BatchLogModule } from '..'
import { InboundOrder } from '@model/index'
import { BatchLogService } from '../batchLog/batchLog.service'

@Module({
  imports: [RedisModule, forwardRef(() => BatchLogModule), SequelizeModule.forFeature([InboundOrder])],
  controllers: [InboundOrderController],
  providers: [InboundOrderService, BatchLogService],
  exports: [],
})
export class InboundOrderModule { }
