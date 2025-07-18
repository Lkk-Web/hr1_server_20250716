import { Module } from '@nestjs/common'
import { MiService } from './mi.service'
import { MiController } from './mi.controller'
import { HttpModule, HttpService } from '@nestjs/axios'
import { RedisModule } from '@library/redis'

@Module({
  imports: [HttpModule,RedisModule],
  controllers: [MiController],
  providers: [MiService],
})
export class MiModule {}
