import { Module } from '@nestjs/common'
import { ApiDictController } from './apiDict.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { ApiDictService } from './apiDict.service'
import { RedisModule } from '@library/redis'
import { ApiDict } from '@model/index'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ApiDict])],
  controllers: [ApiDictController],
  providers: [ApiDictService],
  exports: [],
})
export class ApiDictModule { }
