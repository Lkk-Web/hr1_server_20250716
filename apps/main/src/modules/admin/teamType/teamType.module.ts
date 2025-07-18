import { Module } from '@nestjs/common'
import { TeamTypeController } from './teamType.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { TeamType } from '@model/schedule/teamType.model'
import { sign } from 'crypto'
import { TeamTypeService } from './teamType.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([TeamType])],
  controllers: [TeamTypeController],
  providers: [TeamTypeService],
  exports: [],
})
export class TeamTypeModule {}
