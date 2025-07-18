import { Module } from '@nestjs/common'
import { PrintTemplateController } from './printTemplate.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { PrintTemplate } from '@model/sys/printTemplate.model'
import { sign } from 'crypto'
import { PrintTemplateService } from './printTemplate.service'
import { RedisModule } from '@library/redis'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([PrintTemplate])],
  controllers: [PrintTemplateController],
  providers: [PrintTemplateService],
  exports: [],
})
export class PrintTemplateModule {}
