import { Module } from '@nestjs/common'
import { InspectionFormController } from './inspectionForm.controller'
import { InspectionFormService } from './inspectionForm.service'
import { InspectionFormService as AdminInspectionFormService } from '@modules/admin/inspectionForm/inspectionForm.service'
import { RedisModule } from '@library/redis'
import { ProductionReportTwoService } from '@modules/station/productionReport/productionReportTwo.service'

@Module({
  imports: [RedisModule],
  controllers: [InspectionFormController],
  providers: [InspectionFormService, AdminInspectionFormService, ProductionReportTwoService],
  exports: [],
})
export class InspectionFormModule {}
