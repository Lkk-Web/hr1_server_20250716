import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { ProductSerialService } from './productSerial.service'
import { FindProductSerialDto, UpdateProductSerialDto, UpdateProcessProgressDto } from './productSerial.dto'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { OpenAuthorize } from '@core/decorator/metaData'
import { AdminAuth } from '@core/decorator/controller'

@ApiTags('产品序列号')
@ApiBearerAuth()
@AdminAuth('productSerial')
export class ProductSerialController {
  constructor(private readonly productSerialService: ProductSerialService) {}

  @Get('findPagination')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '分页查询产品序列号' })
  async findPagination(@Query() dto: FindProductSerialDto, @CurrentPage() pagination: Pagination) {
    return await this.productSerialService.findPagination(dto, pagination)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询产品序列号详情' })
  @ApiParam({ name: 'id', description: '序列号ID' })
  async findOne(@Param('id') id: string) {
    return await this.productSerialService.findOne(id)
  }

  @Get('byTask/:productionOrderTaskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据生产订单任务ID查询产品序列号' })
  @ApiParam({ name: 'productionOrderTaskId', description: '生产订单任务ID' })
  @OpenAuthorize()
  async findByProductionOrderTaskId(@Param('productionOrderTaskId') productionOrderTaskId: string) {
    return await this.productSerialService.findByProductionOrderTaskId(productionOrderTaskId)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新产品序列号' })
  @ApiParam({ name: 'id', description: '序列号ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductSerialDto) {
    return await this.productSerialService.update(id, dto)
  }

  @Put(':id/processProgress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新工序进度' })
  @ApiParam({ name: 'id', description: '序列号ID' })
  async updateProcessProgress(@Param('id') id: string, @Body() dto: UpdateProcessProgressDto) {
    return await this.productSerialService.updateProcessProgress(id, dto)
  }

  @Post('batchUpdateStatus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量更新产品序列号状态' })
  async batchUpdateStatus(@Body() dto: { ids: string[]; status: string }) {
    await this.productSerialService.batchUpdateStatus(dto.ids, dto.status as any)
    return { message: '批量更新成功' }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除产品序列号' })
  @ApiParam({ name: 'id', description: '序列号ID' })
  async delete(@Param('id') id: string) {
    await this.productSerialService.delete(id)
    return { message: '删除成功' }
  }
}