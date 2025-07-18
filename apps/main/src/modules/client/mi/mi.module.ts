import { Module } from '@nestjs/common'
import { MiService } from './mi.service'
import { MiController } from './mi.controller'
import { HttpModule } from '@nestjs/axios'
import { RedisModule } from '@library/redis'
import { MiService as ClientMiService } from '@modules/admin/mi/mi.service'

@Module({
  imports: [HttpModule,RedisModule],
  controllers: [MiController],
  providers: [MiService,ClientMiService],
})
export class MiModule {}
