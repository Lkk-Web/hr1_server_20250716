
import { Module } from "@nestjs/common";
import { SYSOrgController } from "./controllers/SYSOrg.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { SYSOrg } from "@model/sys/SYSOrg.model";
import { sign } from "crypto";
import { SYSOrgService } from "./services/SYSOrg.service";
import { RedisModule } from '@library/redis';
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([SYSOrg]),
  ],
  controllers: [SYSOrgController],
  providers: [SYSOrgService],
  exports: [],
})
export class SYSOrgModule { }
