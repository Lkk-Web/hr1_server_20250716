import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger'
import { ProductionOrderTaskService } from './productionOrderTask.service'
import { FindProductionOrderTaskDto, UpdateProductionOrderTaskDto, ProductionOrderTaskActionDto } from './productionOrderTask.dto'
import { OpenAuthorize } from '@core/decorator/metaData'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { AdminAuth } from '@core/decorator/controller'

@ApiTags('生产工单')
@ApiBearerAuth()
@AdminAuth('productionOrderTask')
export class ProductionOrderTaskController {
  constructor(private readonly productionOrderTaskService: ProductionOrderTaskService) {}

  @Get('findPagination')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '分页查询生产订单任务' })
  async findPagination(@Query() dto: FindProductionOrderTaskDto, @CurrentPage() pagination: Pagination) {
    return await this.productionOrderTaskService.findPagination(dto, pagination)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询生产订单任务详情' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async findOne(@Param('id') id: string) {
    return await this.productionOrderTaskService.findOne(id)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新生产订单任务' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductionOrderTaskDto) {
    return await this.productionOrderTaskService.update(id, dto)
  }

  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '生产订单任务操作' })
  @ApiParam({ name: 'id', description: '任务ID' })
  async action(@Param('id') id: string, @Body() dto: ProductionOrderTaskActionDto) {
    // return await this.productionOrderTaskService.action(id, dto)
  }

  // @Delete(':id')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '删除生产订单任务' })
  // @ApiParam({ name: 'id', description: '任务ID' })
  // async delete(@Param('id') id: string) {
  //   return await this.productionOrderTaskService.delete(id)
  // }
}
