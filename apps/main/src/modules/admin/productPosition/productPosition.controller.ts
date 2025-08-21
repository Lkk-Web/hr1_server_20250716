import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { ProductPositionService } from './productPosition.service'
import { CreateProductPositionDto, FindPaginationDto, UpdateProductPositionDto } from './productPosition.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { ApiPlatformWhitelist } from '@core/decorator/metaData'

@ApiTags('工位管理')
@ApiBearerAuth()
@AdminAuth('productPosition')
export class ProductPositionController {
  constructor(private readonly service: ProductPositionService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CreateProductPositionDto) {
    const result = await this.service.create(dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UpdateProductPositionDto, @Param() params) {
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
  @ApiOperation({ summary: '详情' })
  @ApiPlatformWhitelist(['admin', 'station'])
  @Get('find')
  async find(@Query() dto: FindPaginationDto) {
    const result = await this.service.find(dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination) {
    const result = await this.service.findPagination(dto, pagination)
    return result
  }
}
