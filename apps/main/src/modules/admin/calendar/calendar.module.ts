import { Module } from '@nestjs/common'
import { CalendarController } from './calendar.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Calendar } from '@model/sm/calendar.model'
import { sign } from 'crypto'
import { CalendarService } from './calendar.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Calendar])],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [],
})
export class CalendarModule { }
