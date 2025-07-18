import { authServiceConfig } from '@common/config'
import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'

@Global() //全局模块，其他文件不需要每个导入
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
