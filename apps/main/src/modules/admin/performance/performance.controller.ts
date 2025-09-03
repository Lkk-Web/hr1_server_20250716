import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common'
import { AdminAuth, ApiRes } from '@core/decorator/controller'
import { PerformanceService } from './performance.service'
import { OpenAuthorize } from '@core/decorator/metaData'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { FindPaginationDto, FindPaginationTotalDto, findProductSpecDto, performanceCreateDto, performanceUpdateDto } from './performance.dto'

@ApiTags('绩效工价管理')
@ApiBearerAuth()
@AdminAuth('performance')
@OpenAuthorize()
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: performanceCreateDto) {
    const result = await this.service.create(dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: performanceUpdateDto, @Param() params) {
    const { id } = params
    const result = await this.service.edit(dto, id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params) {
    const { id } = params
    const result = await this.service.delete(id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据产品名称查询产品规格' })
  @Get('/findProductSpec')
  async findProductSpec(@Query() dto: findProductSpecDto) {
    const result = await this.service.findProductSpec(dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('/find/:id')
  async find(@Param() Param) {
    const result = await this.service.find(Param.id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '计件统计详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('/findTotal/:id')
  async findTotal(@Param() Param) {
    const result = await this.service.findTotal(Param.id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('/findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination) {
    const result = await this.service.findPagination(dto, pagination)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '计件统计列表' })
  @Get('/findPaginationTotal')
  async findPaginationTotal(@Query() dto: FindPaginationTotalDto, @CurrentPage() pagination: Pagination) {
    const result = await this.service.FindPaginationTotal(dto, pagination)
    return result
  }
}
