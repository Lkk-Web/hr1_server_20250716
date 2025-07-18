import { Module } from '@nestjs/common'
import { ScrapOrderController } from './scrapOrder.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { ScrapOrderService } from './scrapOrder.service'
import { RedisModule } from '@library/redis'
import { ScrapOrder } from '@model/equipment/scrapOrder.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ScrapOrder])],
  controllers: [ScrapOrderController],
  providers: [ScrapOrderService],
  exports: [],
})
export class ScrapOrderModule {}
