import { Module } from '@nestjs/common';
import { RedisModule } from '@library/redis';
import { HookController } from './hook.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { HookService } from './hook.service';
import {HookTwoService} from "./hookTwo.service";

@Module({
  controllers: [
    HookController,
  ],
  providers:[HookService,HookTwoService]
})
export class HookModule {}
