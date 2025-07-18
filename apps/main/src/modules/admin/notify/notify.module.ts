import { Module } from '@nestjs/common'
import { NotifyController } from './notify.controller'
import { NotifyService } from './notify.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule],
  controllers: [NotifyController],
  providers: [NotifyService],
  exports: [],
})
export class NotifyModule { }
