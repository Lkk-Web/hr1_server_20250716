import { Module } from '@nestjs/common'
import { CustomerController } from './customer.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Customer } from '@model/base/customer.model'
import { sign } from 'crypto'
import { CustomerService } from './customer.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Customer])],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [],
})
export class CustomerModule {}
