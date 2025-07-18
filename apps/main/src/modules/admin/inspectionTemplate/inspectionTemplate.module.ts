
import { forwardRef, Module } from "@nestjs/common";
import { InspectionTemplateController } from "./inspectionTemplate.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { InspectionTemplateService } from "./inspectionTemplate.service";
import { RedisModule } from '@library/redis';
import { InspectionTemplate } from '@model/qm/inspectionTemplate.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([InspectionTemplate]),
  ],
  controllers: [InspectionTemplateController],
  providers: [InspectionTemplateService],
  exports: [],
})
export class InspectionTemplateModule { }
