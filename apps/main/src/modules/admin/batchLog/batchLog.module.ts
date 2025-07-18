import { Module } from '@nestjs/common'
import { BatchLogController } from './batchLog.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { BatchLogService } from './batchLog.service'
import { BatchLog } from '@model/index'
@Module({
  imports: [SequelizeModule.forFeature([BatchLog])],
  controllers: [BatchLogController],
  providers: [BatchLogService],
  exports: [],
})
export class BatchLogModule { }
