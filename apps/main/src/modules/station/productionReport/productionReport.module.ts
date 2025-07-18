import { forwardRef, Module } from '@nestjs/common'
import { ProductionReportController } from './productionReport.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionReport } from '@model/production/productionReport.model'
import { ProductionReportService } from './productionReport.service'
import { RedisModule } from '@library/redis'
import { BatchLogModule } from '@modules/admin/batchLog/batchLog.module'
import { BatchLogService } from '@modules/admin/batchLog/batchLog.service'
import { ProductionReportTwoService } from '@modules/station/productionReport/productionReportTwo.service'

@Module({
  imports: [RedisModule, forwardRef(() => BatchLogModule), SequelizeModule.forFeature([ProductionReport])],
  controllers: [ProductionReportController],
  providers: [ProductionReportService, BatchLogService, ProductionReportTwoService],
  exports: [],
})
export class ProductionReportModule {}
