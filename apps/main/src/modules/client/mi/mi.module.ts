import { Module } from '@nestjs/common'
import { MiService } from './mi.service'
import { MiController } from './mi.controller'
import { FileService } from '@modules/file/file.service'
import { MicroserviceClientModule } from '@library/microserviceClient/microserviceClient.module'

@Module({
  imports: [MicroserviceClientModule],
  controllers: [MiController],
  providers: [MiService, FileService],
})
export class MiModule {}
