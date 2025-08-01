import { AdminAuth } from '@core/decorator/controller'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { WorkCenterService } from './workCenter.service'
import { Sequelize } from 'sequelize-typescript'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { CreateWorkCenterDto, FindPaginationDto, FindPaginationScheduleDto, ScheduleDto, UpdateWorkCenterDto } from './workCenter.dto'
// import { FindPaginationDto } from "../transferOrder/transferOrder.dto";
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'

@ApiTags('工作中心')
@ApiBearerAuth()
@AdminAuth('workcenter')
export class WorkCenterController {
  constructor(private readonly service: WorkCenterService, private readonly sequelize: Sequelize) {}

  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CreateWorkCenterDto, @Req() req) {
    console.log('测试一下', dto)
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
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
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param('id') id: number, @Req() req) {
    return await this.service.delete(id, req.loadModel)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateWorkCenterDto, @Req() req) {
    return await this.service.update(id, dto, req.loadModel)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get(':id')
  async detail(@Param('id') id: number, @Req() req) {
    return await this.service.detail(id, req.loadModel)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '排程' })
  @Post('schedule')
  async schedule(@Body() dto: ScheduleDto, @Req() req) {
    return await this.service.schedule(dto, req.loadModel)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '排程列表' })
  @Get('findPagination/Schedule')
  async findPaginationSchedule(@Query() dto: FindPaginationScheduleDto, @CurrentPage() pagination: Pagination, @Req() req) {
    return await this.service.findPaginationSchedule(dto, pagination)
  }
}
