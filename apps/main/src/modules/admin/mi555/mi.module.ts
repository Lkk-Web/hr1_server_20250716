import { Module } from '@nestjs/common'
import { MiService } from './mi.service'
import { MiController } from './mi.controller'

@Module({
  controllers: [MiController],
  providers: [MiService],
})
export class MiModule {}
