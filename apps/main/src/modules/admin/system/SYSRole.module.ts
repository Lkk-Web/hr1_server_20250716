
import { Module } from "@nestjs/common";
import { SysRoleController } from "./controllers/SYSRole.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { SYSRole } from "@model/sys/SYSRole.model";
import { sign } from "crypto";
import { SysRoleService } from "./services/SYSRole.service";
import { RedisModule } from '@library/redis';
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([SYSRole]),
  ],
  controllers: [SysRoleController],
  providers: [SysRoleService],
  exports: [],
})
export class SysRoleModule { }
