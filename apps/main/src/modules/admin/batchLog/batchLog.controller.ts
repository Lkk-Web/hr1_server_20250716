import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Body, Get, HttpCode, HttpStatus, Param, Post, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { BatchLogService } from './batchLog.service'
import { CBatchLogDto, FindPaginationDto } from './batchLog.dto'
import { Sequelize } from 'sequelize-typescript'

@ApiTags('批次日志记录')
@ApiBearerAuth()
@AdminAuth('batchLog')
export class BatchLogController {
  constructor(private readonly service: BatchLogService, private readonly sequelize: Sequelize) {}

  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CBatchLogDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() param, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.find(param.id, loadModel)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, loadModel)
    return result
  }
}
