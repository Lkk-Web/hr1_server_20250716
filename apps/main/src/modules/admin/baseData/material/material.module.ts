import { Module } from '@nestjs/common'
import { MaterialController } from './material.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Material } from '@model/base/material.model'
import { sign } from 'crypto'
import { MaterialService } from './material.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Material])],
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [],
})
export class MaterialModule {}
