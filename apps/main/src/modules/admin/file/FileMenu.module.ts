import { Module } from '@nestjs/common'
import { FileMenuController } from './controllers/FileMenu.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { FileMenu } from '@model/document/FileMenu.model'
import { sign } from 'crypto'
import { FileMenuService } from './services/FileMenu.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([FileMenu])],
  controllers: [FileMenuController],
  providers: [FileMenuService],
  exports: [],
})
export class FileMenuModule {}
