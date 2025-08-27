import { Module, forwardRef } from '@nestjs/common'
import { InspectionFormController } from './inspectionForm.controller'
import { InspectionFormService } from './inspectionForm.service'
import { RedisModule } from '@library/redis'
import { ProductionReportTwoService } from '@modules/station/productionReport/productionReportTwo.service'
import { ProductionOrderModule } from '../productionOrder/productionOrder.module'

@Module({
  imports: [RedisModule, forwardRef(() => ProductionOrderModule)],
  controllers: [InspectionFormController],
  providers: [InspectionFormService, ProductionReportTwoService],
  exports: [],
})
export class InspectionFormModule {}
