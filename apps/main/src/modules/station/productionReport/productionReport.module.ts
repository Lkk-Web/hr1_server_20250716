import { forwardRef, Module } from '@nestjs/common'
import { ProductionReportController } from './productionReport.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionReport } from '@model/production/productionReport.model'
import { ProductionReportService } from './productionReport.service'
import { RedisModule } from '@library/redis'
import { BatchLogModule } from '@modules/admin/batchLog/batchLog.module'
import { BatchLogService } from '@modules/admin/batchLog/batchLog.service'
import { ProductionReportTwoService } from '@modules/station/productionReport/productionReportTwo.service'
import { ProductionOrderModule } from '@modules/admin/productionOrder/productionOrder.module'
import { ProductionOrderTaskModule } from '@modules/admin/productionOrderTask/productionOrderTask.module'

@Module({
  imports: [RedisModule, forwardRef(() => BatchLogModule), SequelizeModule.forFeature([ProductionReport]), forwardRef(() => ProductionOrderModule)],
  controllers: [ProductionReportController],
  providers: [ProductionReportService, BatchLogService, ProductionReportTwoService],
  exports: [],
})
export class ProductionReportModule {}
