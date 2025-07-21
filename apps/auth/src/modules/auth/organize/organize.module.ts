import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Organize } from '@model/auth/organize'
import { sign } from 'crypto'
import { OrganizeService } from './organize.service'
import { RedisModule } from '@library/redis'
import { OrganizeController } from './organize.controller'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Organize])],
  controllers: [OrganizeController],
  providers: [OrganizeService],
  exports: [],
})
export class OrganizeModule {}
