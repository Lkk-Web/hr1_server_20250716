import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { DashboardService } from './dashboard.service'
import { FindProductionOrderTaskDto, OrderFindPagination } from './dashboard.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('仪表盘')
@ApiBearerAuth()
@AdminAuth('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService, private readonly sequelize: Sequelize) {}

  @Get('findPagination')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '工单进度展示' })
  async findPagination(@Query() dto: FindProductionOrderTaskDto, @CurrentPage() pagination: Pagination) {
    return await this.service.findPagination(dto, pagination)
  }

  @Get('OrderFindPagination')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '订单数据展示' })
  async OrderFindPagination(@Query() dto: OrderFindPagination) {
    return await this.service.OrderFindPagination(dto)
  }
}
