import { Module } from '@nestjs/common'
import { MiService } from './mi.service'
import { MiController } from './mi.controller'
import { HttpModule, HttpService } from '@nestjs/axios'
import { RedisModule } from '@library/redis'
import { FileService } from '@modules/file/file.service'

@Module({
  imports: [HttpModule, RedisModule],
  controllers: [MiController],
  providers: [MiService, FileService],
  exports: [MiService],
})
export class MiModule {}
