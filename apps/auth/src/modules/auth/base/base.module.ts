import { Module } from '@nestjs/common'
import { MiService } from './base.service'
import { MiController } from './base.controller'
import { FileService } from '@modules/file/file.service'

@Module({
  controllers: [MiController],
  providers: [MiService, FileService],
})
export class MiModule {}
