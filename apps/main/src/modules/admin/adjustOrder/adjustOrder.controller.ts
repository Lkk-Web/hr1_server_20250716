import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { AdjustOrderService } from './adjustOrder.service'
import { CAdjustOrderDto, FindPaginationDto, UAdjustOrderDto } from './adjustOrder.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { deleteIdsDto } from '@common/dto'
import { auditDto } from '@modules/station/productionReport/productionReport.dto'

@ApiTags('盘点单')
@ApiBearerAuth()
@AdminAuth('adjustOrder')
export class AdjustOrderController {
  constructor(private readonly service: AdjustOrderService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CAdjustOrderDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UAdjustOrderDto, @Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.edit(dto, id, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.delete(id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, pagination, loadModel)
    return result
  }

  @ApiOperation({ summary: '审核' })
  @HttpCode(HttpStatus.OK)
  @Post('audit')
  async audit(@Body() dto: auditDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.audit(dto, req.user, loadModel)
    return result
  }

  @ApiOperation({ summary: '批量删除' })
  @HttpCode(HttpStatus.OK)
  @Post('batDelete')
  async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.batDelete(dto, loadModel)
    return result
  }
}
