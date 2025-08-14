import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { ClientAuth } from '@core/decorator/controller'
import { ProductionReportService } from './productionReport.service'
import { batchDto, CProductionReportDto, FindPaginationDto, UProductionReportDto } from './productionReport.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { deleteIdsDto } from '@common/dto'

@ApiTags('生产报工')
@ApiBearerAuth()
@ClientAuth('productionReport')
export class ProductionReportController {
  constructor(private readonly service: ProductionReportService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CProductionReportDto, @Req() req) {
    // const result = await this.service.create(dto, req.user)
    // return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UProductionReportDto, @Param() params, @Req() req) {
    // const { id } = params
    // const result = await this.service.edit(dto, id, req.user)
    // return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    // const { id } = params
    // const result = await this.service.delete(id)
    // return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() Param, @Req() req) {
    // let { factoryCode, loadModel } = req
    // const result = await this.service.find(Param.id)
    // return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    // const result = await this.service.findPagination(dto, pagination)
    // return result
  }

  @ApiOperation({ summary: '批量报工' })
  @HttpCode(HttpStatus.OK)
  @Post('batch')
  async batch(@Body() dto: batchDto, @Req() req) {
    // const result = await this.service.batch(dto, req.user)
    // return result
  }

  @ApiOperation({ summary: '批量删除' })
  @HttpCode(HttpStatus.OK)
  @Post('batDelete')
  async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
    // const result = await this.service.batDelete(dto)
    // return result
  }
}
