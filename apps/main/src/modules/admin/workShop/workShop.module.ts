import { Module } from '@nestjs/common'
import { WorkShopController } from './workShop.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { WorkShop } from '@model/base/workShop.model'
import { sign } from 'crypto'
import { WorkShopService } from './workShop.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([WorkShop])],
  controllers: [WorkShopController],
  providers: [WorkShopService],
  exports: [],
})
export class WorkShopModule {}
