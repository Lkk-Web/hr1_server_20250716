import { forwardRef, Module } from '@nestjs/common'
import { MaterialRequisitionController } from './materialRequisition.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { MaterialRequisitionService } from './materialRequisition.service'
import { RedisModule } from '@library/redis'
import { MaterialRequisition } from '@model/wm/materialRequisition.model'
import { BatchLogModule } from '../batchLog/batchLog.module'
import { BatchLogService } from '../batchLog/batchLog.service'

@Module({
  imports: [RedisModule, forwardRef(() => BatchLogModule), SequelizeModule.forFeature([MaterialRequisition])],
  controllers: [MaterialRequisitionController],
  providers: [MaterialRequisitionService, BatchLogService],
  exports: [],
})
export class MaterialRequisitionModule {}
