
import { Module } from "@nestjs/common";
import { EquipmentController } from "./equipment.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { EquipmentService } from "./equipment.service";
import { RedisModule } from '@library/redis';
import { Equipment } from '@model/em/equipment.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([Equipment]),
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [],
})
export class EquipmentModule {}
