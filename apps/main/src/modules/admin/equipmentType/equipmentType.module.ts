import { Module } from '@nestjs/common'
import { EquipmentTypeController } from './equipmentType.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { EquipmentTypeService } from './equipmentType.service'
import { RedisModule } from '@library/redis'
import { EquipmentType } from '@model/equipment/equipmentType.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([EquipmentType])],
  controllers: [EquipmentTypeController],
  providers: [EquipmentTypeService],
  exports: [],
})
export class EquipmentTypeModule {}
