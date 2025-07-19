import { Module } from '@nestjs/common'
import { SysMenuController } from './controllers/menu.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Menu } from '@model/auth/menu'
import { sign } from 'crypto'
import { SysMenuService } from './services/menu.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Menu])],
  controllers: [SysMenuController],
  providers: [SysMenuService],
  exports: [],
})
export class MenuModule {}
