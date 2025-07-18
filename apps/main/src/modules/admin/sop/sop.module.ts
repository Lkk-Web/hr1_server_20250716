
import { Module } from "@nestjs/common";
import { SopController } from "./sop.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { sign } from "crypto";
import { SopService } from "./sop.service";
import { RedisModule } from '@library/redis';
import { SOP } from '@model/pm/SOP.model'
import { SOPMaterial } from '@model/pm/SOPMaterial.model'
import { SOPFile } from '@model/pm/SOPFile.model'
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([SOP,SOPMaterial,SOPFile]),
  ],
  controllers: [SopController],
  providers: [SopService],
  exports: [],
})
export class SopModule {}
