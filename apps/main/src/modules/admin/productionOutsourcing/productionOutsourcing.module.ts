import { Module } from '@nestjs/common'
import { ProductionOutsourcingController } from './productionOutsourcing.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { sign } from 'crypto'
import { ProductionOutsourcingService } from './productionOutsourcing.service'
import { RedisModule } from '@library/redis'
import { ProductionOutsourcing } from '@model/production/productionOutsourcing.model'
@Module({
  imports: [RedisModule, SequelizeModule.forFeature([ProductionOutsourcing])],
  controllers: [ProductionOutsourcingController],
  providers: [ProductionOutsourcingService],
  exports: [],
})
export class ProductionOutsourcingModule {}
