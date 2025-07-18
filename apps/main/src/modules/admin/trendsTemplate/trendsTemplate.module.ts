import { Module } from '@nestjs/common'
import { TrendsTemplateService } from './trendsTemplate.service'
import { TrendsTemplateController } from './trendsTemplate.controller'
import { SequelizeModule } from "@nestjs/sequelize";
import { TrendsTemplate } from "@model/index";

@Module({
  imports: [SequelizeModule.forFeature([TrendsTemplate])],
  controllers: [TrendsTemplateController],
  providers: [TrendsTemplateService],
})
export class TrendsTemplateModule { }
