import { Module } from '@nestjs/common'
import { FileListController } from './controllers/FileList.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { FileList } from '@model/document/FileList.model'
import { sign } from 'crypto'
import { FileListService } from './services/FileList.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([FileList])],
  controllers: [FileListController],
  providers: [FileListService],
  exports: [],
})
export class FileListModule {}
