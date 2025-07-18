import { AdminAuth } from '@core/decorator/controller'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CTrendsTemplateDto, ETrendsTemplateDto, TrendsTemplateListDto } from './trendsTemplate.dto'
import { TrendsTemplateService } from './trendsTemplate.service'
import { CurrentPage } from '@core/decorator/request'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'

@ApiTags('动态字段模版管理')
@ApiBearerAuth()
@AdminAuth('trendsTemplate')
export class TrendsTemplateController {
  constructor(private readonly service: TrendsTemplateService) {}

  @ApiOperation({ summary: '添加动态字段模版' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  async create(@Body(new CensorParamPipe()) dto: CTrendsTemplateDto, @Req() req) {
    return this.service.create(dto)
  }

  @ApiOperation({ summary: '动态字段模版列表' })
  @HttpCode(HttpStatus.OK)
  @Get('')
  async list(@Query() dto: TrendsTemplateListDto, @CurrentPage() page, @Req() req) {
    let { factoryCode, loadModel } = req

    return this.service.findPagination(dto, page, loadModel)
  }

  @ApiOperation({ summary: '根据编码获取动态字段模版详情' })
  @HttpCode(HttpStatus.OK)
  @Get('getByCode/:code')
  async info(@Param('code') code: string, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.find(code, loadModel)
  }

  @ApiOperation({ summary: '根据id获取动态字段模版详情' })
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async infoById(@Param('id') id: number, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.findId(id, loadModel)
  }

  @ApiOperation({ summary: '编辑动态字段模版' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id' })
  @Put(':id')
  async update(@Param('id') id: number, @Body(new CensorParamPipe()) dto: ETrendsTemplateDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.update(id, dto, loadModel)
  }

  @ApiOperation({ summary: '删除动态字段模版' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id' })
  @Delete(':id')
  async delete(@Param('id') id: number, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.delete(id, loadModel)
  }

  @ApiOperation({ summary: '根据编码获取动态字段模版列表' })
  @HttpCode(HttpStatus.OK)
  @Get('getListByCode/:code')
  async getListByCode(@Param('code') code: string) {
    return this.service.getListByCode(code)
  }
}
