import { Module } from '@nestjs/common'
import { TeamController } from './team.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Team } from '@model/schedule/team.model'
import { sign } from 'crypto'
import { TeamService } from './team.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Team])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [],
})
export class TeamModule {}
