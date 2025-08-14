import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { CApiDictDto, FindPaginationDto, UApiDictDto } from './Dict.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { DictService } from './Dict.service'

@ApiTags('字典配置管理')
@ApiBearerAuth()
@AdminAuth('dict')
export class DictController {
  constructor(private readonly service: DictService) {}

  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/create')
  async create(@Body() dto: CApiDictDto) {
    const result = await this.service.create(dto)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UApiDictDto, @Param() params) {
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
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('/find/:id')
  async find(@Param() Param) {
    const result = await this.service.find(Param.id)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('/findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination) {
    const result = await this.service.findPagination(dto, pagination)
    return result
  }
}
