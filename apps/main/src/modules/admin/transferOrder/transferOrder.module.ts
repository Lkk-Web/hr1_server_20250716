import { Module } from '@nestjs/common'
import { TransferOrderController } from './transferOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { TransferOrderService } from './transferOrder.service'
import { RedisModule } from '@library/redis'
import { TransferOrder } from '@model/warehouse/transferOrder.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([TransferOrder])],
  controllers: [TransferOrderController],
  providers: [TransferOrderService],
  exports: [],
})
export class TransferOrderModule {}
