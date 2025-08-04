import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { WorkShopService } from './workShop.service'
import { CWorkShopDto, FindPaginationDto, FindPaginationScheduleDto, ScheduleDto, UWorkShopDto } from './workShop.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('车间')
@ApiBearerAuth()
@AdminAuth('workShop')
export class WorkShopController {
  constructor(private readonly service: WorkShopService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CWorkShopDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UWorkShopDto, @Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.edit(dto, id, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
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

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '排程' })
  @Post('schedule')
  async schedule(@Body() dto: ScheduleDto, @Req() req) {
    return await this.service.schedule(dto, req.loadModel)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '排程列表' })
  @Get('findPagination/schedule')
  async findPaginationSchedule(@Query() dto: FindPaginationScheduleDto, @CurrentPage() pagination: Pagination, @Req() req) {
    return await this.service.findPaginationSchedule(dto, pagination)
  }
}
