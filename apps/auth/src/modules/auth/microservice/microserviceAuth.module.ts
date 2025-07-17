import { Module } from '@nestjs/common'
import { MicroserviceAuthController } from './microserviceAuth.controller'
import { MiService } from '../base/base.service'
import { FileService } from '@modules/file/file.service'

@Module({
  controllers: [MicroserviceAuthController],
  providers: [MiService, FileService],
})
export class MicroserviceAuthModule {}