import { Module } from '@nestjs/common'
import { ProcessRouteController } from './processRoute.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProcessRoute } from '@model/process/processRoute.model'
import { sign } from 'crypto'
import { ProcessRouteService } from './processRoute.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProcessRoute])],
  controllers: [ProcessRouteController],
  providers: [ProcessRouteService],
  exports: [],
})
export class ProcessRouteModule {}
