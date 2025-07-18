import { Module } from '@nestjs/common'
import { ApiConfigController } from './apiConfig.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { ApiConfigService } from './apiConfig.service'
import { RedisModule } from '@library/redis'
import { ApiConfig } from '@model/index'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ApiConfig])],
  controllers: [ApiConfigController],
  providers: [ApiConfigService],
  exports: [],
})
export class ApiConfigModule { }
