
import { Module } from "@nestjs/common";
import { SysMenuController } from "./controllers/SYSMenu.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { SYSMenu } from "@model/sys/SYSMenu.model";
import { sign } from "crypto";
import { SysMenuService } from "./services/SYSMenu.service";
import { RedisModule } from '@library/redis';
@Module({
  imports: [
    RedisModule,
    SequelizeModule.forFeature([SYSMenu]),
  ],
  controllers: [SysMenuController],
  providers: [SysMenuService],
  exports: [],
})
export class SysMenuModule { }
