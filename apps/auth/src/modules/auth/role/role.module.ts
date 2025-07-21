import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { Role } from '@model/auth/role'
import { RedisModule } from '@library/redis'
import { RoleController } from './role.controller'
import { RoleService } from './role.service'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Role])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [],
})
export class RoleModule {}
