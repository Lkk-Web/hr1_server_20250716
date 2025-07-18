import { Module } from '@nestjs/common'
import { ProductionReportController } from './productionReport.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductionReport } from '@model/pe/productionReport.model'
import { ProductionReportService } from './productionReport.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionReport])],
  controllers: [ProductionReportController],
  providers: [ProductionReportService],
  exports: [],
})
export class ProductionReportModule {}
