
import { Module } from "@nestjs/common";
import { InstallLocationController } from "./installLocation.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { InstallLocationService } from "./installLocation.service";
import { RedisModule } from '@library/redis';
import { InstallLocation } from '@model/em/installLocation.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([InstallLocation]),
  ],
  controllers: [InstallLocationController],
  providers: [InstallLocationService],
  exports: [],
})
export class InstallLocationModule {}
