
import { Module } from "@nestjs/common";
import { InspectionPlanController } from "./inspectionPlan.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { InspectionPlanService } from "./inspectionPlan.service";
import { RedisModule } from '@library/redis';
import { InspectionPlan } from '@model/em/inspectionPlan.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([InspectionPlan]),
  ],
  controllers: [InspectionPlanController],
  providers: [InspectionPlanService],
  exports: [],
})
export class InspectionPlanModule {}
