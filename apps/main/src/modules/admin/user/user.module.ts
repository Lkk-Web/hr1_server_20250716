import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { User } from '@model/sys/user.model'
import { UserService } from './user.service'
import { RedisModule } from '@library/redis'
import { ApiDictService } from '@modules/admin/apiDict/apiDict.service'
import { ApiDict } from '@model/sys/apiDict.model'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([User,ApiDict])],
  controllers: [UserController],
  providers: [UserService,ApiDictService],
  exports: [],
})
export class UserModule {}
