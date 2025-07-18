
import { Module } from "@nestjs/common";
import { RepairOrderController } from "./repairOrder.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { RepairOrderService } from "./repairOrder.service";
import { RedisModule } from '@library/redis';
import { RepairOrder } from '@model/em/repairOrder.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([RepairOrder]),
  ],
  controllers: [RepairOrderController],
  providers: [RepairOrderService],
  exports: [],
})
export class RepairOrderModule {}
