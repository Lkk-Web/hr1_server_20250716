import { Module } from '@nestjs/common'
import { ShiftController } from './shift.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Shift } from '@model/schedule/shift.model'
import { sign } from 'crypto'
import { ShiftService } from './shift.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Shift])],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [],
})
export class ShiftModule {}
