import { Module } from '@nestjs/common'
import { DictController } from './Dict.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { DictService } from './Dict.service'
import { RedisModule } from '@library/redis'
import { Dict } from '@model/system/Dict.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Dict])],
  controllers: [DictController],
  providers: [DictService],
})
export class DictModule {}
