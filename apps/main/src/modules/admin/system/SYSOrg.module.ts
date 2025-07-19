import { Module } from '@nestjs/common'
import { SYSOrgController } from './controllers/SYSOrg.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Organize } from '@model/auth/organize'
import { sign } from 'crypto'
import { SYSOrgService } from './services/SYSOrg.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Organize])],
  controllers: [SYSOrgController],
  providers: [SYSOrgService],
  exports: [],
})
export class SYSOrgModule {}
