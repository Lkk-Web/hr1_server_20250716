import { AdminAuth } from '@core/decorator/controller'
import { Body, Delete, HttpCode, HttpStatus, Param, Post, Put, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CTrendsFieldDto, ETrendsFieldDto } from './trendsField.dto'
import { TrendsFieldService } from './trendsField.service'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { IPUtil } from '@library/utils/ip.util'

@ApiTags('动态字段管理')
@ApiBearerAuth()
@AdminAuth('trendsField')
export class TrendsFieldController {
  constructor(private readonly service: TrendsFieldService) {}

  @ApiOperation({ summary: '添加动态字段' })
  @HttpCode(HttpStatus.OK)
  @Post('')
  async create(@Body(new CensorParamPipe()) dto: CTrendsFieldDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.create(dto, req.user, IPUtil.getIp(req).replace('::ffff:', ''), loadModel)
  }

  // @ApiOperation({ summary: '动态字段列表' })
  // @HttpCode(HttpStatus.OK)
  // @Get('')
  // async list(@Query() dto: TrendsFieldListDto, @CurrentPage() page) {

  //   return this.service.findPagination(dto, page)
  // }

  @ApiOperation({ summary: '编辑动态字段' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id' })
  @Put(':id')
  async update(@Param('id') id: number, @Body(new CensorParamPipe()) dto: ETrendsFieldDto, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.update(id, dto, req.user, IPUtil.getIp(req).replace('::ffff:', ''), loadModel)
  }

  @ApiOperation({ summary: '删除动态字段' })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id' })
  @Delete(':id')
  async delete(@Param('id') id: number, @Req() req) {
    let { factoryCode, loadModel } = req
    return this.service.delete(id, req.user, IPUtil.getIp(req).replace('::ffff:', ''), loadModel)
  }
}
