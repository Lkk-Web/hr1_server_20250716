import { Module, forwardRef } from '@nestjs/common'
import { InspectionFormController } from './inspectionForm.controller'
import { InspectionFormService } from './inspectionForm.service'
import { InspectionFormService as AdminInspectionFormService } from '@modules/admin/inspectionForm/inspectionForm.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule],
  controllers: [InspectionFormController],
  providers: [InspectionFormService, AdminInspectionFormService],
  exports: [],
})
export class InspectionFormModule {}
