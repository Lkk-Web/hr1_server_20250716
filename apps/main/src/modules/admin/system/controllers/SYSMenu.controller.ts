import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Permissions } from '@core/decorator/metaData'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { SysMenuService } from '../services/SYSMenu.service'
import { CSYSMenuDto, ESYSMenuDto, FindPaginationDto } from '../dtos/SYSMenu.dto'
import { SYSMenu } from '@model/sys/SYSMenu.model'
import { Sequelize } from 'sequelize-typescript'

@ApiTags('菜单')
@ApiBearerAuth()
@AdminAuth('SYSMenu')
export class SysMenuController {
  constructor(private readonly service: SysMenuService, private readonly sequelize: Sequelize) {}
  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  @Permissions('sy:me:add')
  async create(@Body() dto: CSYSMenuDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  @Permissions('sy:me:edit')
  async edit(@Body() dto: ESYSMenuDto, @Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.edit(dto, id, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Delete(':id')
  @Permissions('sy:me:del')
  async delete(@Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.delete(id, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  @Permissions('sy:me:list')
  async find(@Param() Param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(Param.id, loadModel)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  @Permissions('sy:me:list')
  async findPagination(@Query() dto: FindPaginationDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, loadModel)
    return result
  }
}
