import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { ApiDictService } from './apiDict.service'
import { CApiDictDto, FindPaginationDto, GetByK3Dto, UApiDictDto } from './apiDict.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('对接字典配置')
@ApiBearerAuth()
@AdminAuth('apiDict')
export class ApiDictController {
  constructor(private readonly service: ApiDictService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CApiDictDto, @Req() req) {
    const result = await this.service.create(dto)
    return result
  }

  @ApiOperation({ summary: '同步金蝶字典数据' })
  @HttpCode(HttpStatus.OK)
  @Post('/getKingdee')
  async getKingdee(@Body() dto: GetByK3Dto) {
    const result = await this.service.getKingdee(dto)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UApiDictDto, @Param() params, @Req() req) {
    const { id } = params
    const result = await this.service.edit(dto, id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    const { id } = params
    const result = await this.service.delete(id)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() Param, @Req() req) {
    const result = await this.service.find(Param.id)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findPagination(dto, pagination)
    return result
  }
}
