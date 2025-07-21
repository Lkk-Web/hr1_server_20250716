import { Module } from '@nestjs/common'
import { SYSBusinessLogController } from './controllers/SYSBusinessLog.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { SYSBusinessLogService } from './services/SYSBusinessLog.service'
import { RedisModule } from '@library/redis'
import { SystemBusinessLog } from '@model/system/operationLog'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([SystemBusinessLog])],
  controllers: [SYSBusinessLogController],
  providers: [SYSBusinessLogService],
  exports: [],
})
export class SysBusinessLogModule {}
