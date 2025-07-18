import { Module } from '@nestjs/common'
import { DefectiveItemController } from './defectiveItem.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { sign } from 'crypto'
import { DefectiveItemService } from './defectiveItem.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([DefectiveItem])],
  controllers: [DefectiveItemController],
  providers: [DefectiveItemService],
  exports: [],
})
export class DefectiveItemModule {}
