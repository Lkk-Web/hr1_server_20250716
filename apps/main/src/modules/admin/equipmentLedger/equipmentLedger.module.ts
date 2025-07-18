import { Module } from '@nestjs/common'
import { EquipmentLedgerController } from './equipmentLedger.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { EquipmentLedgerService } from './equipmentLedger.service'
import { RedisModule } from '@library/redis'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([EquipmentLedger])],
  controllers: [EquipmentLedgerController],
  providers: [EquipmentLedgerService],
  exports: [],
})
export class EquipmentLedgerModule {}
