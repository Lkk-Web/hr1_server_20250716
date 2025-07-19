import { Module, Global } from '@nestjs/common'
import { AuthMicroserviceService } from './auth.microservice'

@Global()
@Module({
  providers: [AuthMicroserviceService],
  exports: [AuthMicroserviceService],
})
export class ServicesModule {}
