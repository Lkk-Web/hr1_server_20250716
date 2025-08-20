import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductPositionService } from './productPosition.service'
import { RedisModule } from '@library/redis'
import { ProductPositionController } from './productPosition.controller'
import { Position } from '@model/production/position.model'
import { PositionDetail } from '@model/production/positionDetail.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Position, PositionDetail])],
  controllers: [ProductPositionController],
  providers: [ProductPositionService],
  exports: [],
})
export class ProductPositionModule {}
