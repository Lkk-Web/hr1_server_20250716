import { Module } from '@nestjs/common'
import { SupplierController } from './supplier.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Supplier } from '@model/base/supplier.model'
import { sign } from 'crypto'
import { SupplierService } from './supplier.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Supplier])],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [],
})
export class SupplierModule {}
