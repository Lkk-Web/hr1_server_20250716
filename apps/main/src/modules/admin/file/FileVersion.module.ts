import { Module } from '@nestjs/common'
import { FileVersionController } from './controllers/FileVersion.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { FileVersion } from '@model/dm/FileVersion.model'
import { sign } from 'crypto'
import { FileVersionService } from './services/FileVersion.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([FileVersion])],
  controllers: [FileVersionController],
  providers: [FileVersionService],
  exports: [],
})
export class FileVersionModule {}
