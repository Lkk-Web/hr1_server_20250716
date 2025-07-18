import { forwardRef, Module } from '@nestjs/common'
import { ProductionReportController } from './productionReport.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionReport } from '@model/production/productionReport.model'
import { sign } from 'crypto'
import { ProductionReportService } from './productionReport.service'
import { RedisModule } from '@library/redis'
import { BatchLogModule } from '../batchLog/batchLog.module'
import { BatchLogService } from '../batchLog/batchLog.service'

@Module({
  imports: [RedisModule, forwardRef(() => BatchLogModule), SequelizeModule.forFeature([ProductionReport])],
  controllers: [ProductionReportController],
  providers: [ProductionReportService, BatchLogService],
  exports: [],
})
export class ProductionReportModule {}
