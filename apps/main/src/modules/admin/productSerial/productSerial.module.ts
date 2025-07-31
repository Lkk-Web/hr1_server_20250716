import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ProductSerial } from '@model/production/productSerial.model'
import { ProductSerialController } from './productSerial.controller'
import { ProductSerialService } from './productSerial.service'

@Module({
  imports: [SequelizeModule.forFeature([ProductSerial])],
  controllers: [ProductSerialController],
  providers: [ProductSerialService],
  exports: [ProductSerialService],
})
export class ProductSerialModule {}