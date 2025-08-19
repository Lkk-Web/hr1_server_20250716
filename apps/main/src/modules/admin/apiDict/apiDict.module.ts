import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { ApiDictService } from './apiDict.service'
import { RedisModule } from '@library/redis'
import { ApiDict } from '@model/index'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ApiDict])],
  controllers: [],
  providers: [ApiDictService],
  exports: [],
})
export class ApiDictModule {}
