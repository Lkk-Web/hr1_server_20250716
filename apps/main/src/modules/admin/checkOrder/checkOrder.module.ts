
import { Module } from "@nestjs/common";
import { CheckOrderController } from "./checkOrder.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { CheckOrderService } from "./checkOrder.service";
import { RedisModule } from '@library/redis';
import { CheckOrder } from '@model/em/checkOrder.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([CheckOrder]),
  ],
  controllers: [CheckOrderController],
  providers: [CheckOrderService],
  exports: [],
})
export class CheckOrderModule {}
