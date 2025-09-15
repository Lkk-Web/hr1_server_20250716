import { Module } from '@nestjs/common'
import { PalletController } from './pallet.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { Pallet } from '@model/base/pallet.model'
import { PalletDetail } from '@model/base/palletDetail.model'
import { PalletService } from './pallet.service'
import { RedisModule } from '@library/redis'

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([Pallet, PalletDetail])],
  controllers: [PalletController],
  providers: [PalletService],
  exports: [],
})
export class PalletModule {}
