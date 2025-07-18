import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { MaintenanceOrderService } from './maintenanceOrder.service'
import { CMaintenanceOrderDto, FindPaginationDto, UMaintenanceOrderDto } from './maintenanceOrder.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { CheckOrderListDto } from '@modules/admin/checkOrder/checkOrder.dto'

@ApiTags('保养单')
@ApiBearerAuth()
@AdminAuth('maintenanceOrder')
export class MaintenanceOrderController {
  constructor(private readonly service: MaintenanceOrderService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CMaintenanceOrderDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UMaintenanceOrderDto, @Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
    const result = await this.service.edit(dto, id, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  async delete(@Param() params, @Req() req) {
    const { id } = params
    let { factoryCode, loadModel } = req
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
  @ApiOperation({ summary: '保养统计', description: 'checkItem:保养项 checkList:保养项详情 details.id:对应保养项的id' })
  @Get('logs')
  async maintenanceLogs(@Query() dto: CheckOrderListDto) {
    return this.service.maintenanceLogs(dto)
  }
}
