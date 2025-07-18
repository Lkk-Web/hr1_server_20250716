
import { Module } from "@nestjs/common";
import { InspectionItemController } from "./inspectionItem.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { InspectionItemService } from "./inspectionItem.service";
import { RedisModule } from '@library/redis';
import { InspectionItem } from '@model/qm/inspectionItem.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([InspectionItem]),
  ],
  controllers: [InspectionItemController],
  providers: [InspectionItemService],
  exports: [],
})
export class InspectionItemModule {}
