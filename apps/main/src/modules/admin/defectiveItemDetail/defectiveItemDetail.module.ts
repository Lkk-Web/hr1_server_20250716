import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { RedisModule } from '@library/redis'
import { ProductionOrder } from '@model/index'
import { DefectiveItemDetailService } from './defectiveItemDetail.service'
import { DefectiveItemDetailController } from './defectiveItemDetail.controller'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionOrder])],
  controllers: [DefectiveItemDetailController],
  providers: [DefectiveItemDetailService],
  exports: [],
})
export class DefectiveItemDetailModule {}
