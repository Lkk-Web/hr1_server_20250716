import { Module } from '@nestjs/common'
import { WarehouseController } from './warehouse.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { sign } from 'crypto'
import { WarehouseService } from './warehouse.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Warehouse])],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [],
})
export class WarehouseModule {}
