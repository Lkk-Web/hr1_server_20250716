import { Module } from '@nestjs/common'
import { ProcessController } from './process.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Process } from '@model/pm/process.model'
import { sign } from 'crypto'
import { ProcessService } from './process.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Process])],
  controllers: [ProcessController],
  providers: [ProcessService],
  exports: [],
})
export class ProcessModule {}
