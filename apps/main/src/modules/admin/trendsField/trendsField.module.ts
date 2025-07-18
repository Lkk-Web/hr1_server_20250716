import { Module } from '@nestjs/common'
import { TrendsFieldService } from './trendsField.service'
import { TrendsFieldController } from './trendsField.controller'
import { SequelizeModule } from "@nestjs/sequelize";
import { TrendsField } from "@model/index";

@Module({
  imports: [SequelizeModule.forFeature([TrendsField])],
  controllers: [TrendsFieldController],
  providers: [TrendsFieldService],
})
export class TrendsFieldModule { }
