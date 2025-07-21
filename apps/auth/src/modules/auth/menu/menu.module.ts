import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Menu } from '@model/auth/menu'
import { RedisModule } from '@library/redis'
import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Menu])],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [],
})
export class MenuModule {}
