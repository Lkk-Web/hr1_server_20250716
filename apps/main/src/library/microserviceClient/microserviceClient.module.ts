import { authServiceConfig } from '@common/config'
import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: authServiceConfig.options,
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class MicroserviceClientModule {}