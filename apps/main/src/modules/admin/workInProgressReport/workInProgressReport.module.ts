import { RedisModule } from "@library/redis";
import { ProductionOrder } from "@model/index";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { WorkInProgressReportController } from "./workInProgressReport.controller";
import { WorkInProgressReportService } from "./workInProgressReport.service";

@Module({
    imports: [RedisModule, SequelizeModule.forFeature([ProductionOrder])],
    controllers: [WorkInProgressReportController],
    providers: [WorkInProgressReportService],
    exports: [],
  })
  export class WorkInProgressReportMoudle {}