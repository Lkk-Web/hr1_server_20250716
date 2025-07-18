import { AdminAuth } from '@core/decorator/controller'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { YieldStatisticsService } from './yieldStatistics.service'
import { Response } from 'express'
import { Sequelize } from 'sequelize-typescript'
import { Body, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common'
import { FindPaginationDto } from './yieldStatistics.dto'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'
import { Aide } from '@library/utils/aide'
import dayjs = require('dayjs')

@ApiTags('产量统计')
@ApiBearerAuth()
@AdminAuth('yieldStatistics')
export class YieldStatisticsController {
  constructor(private readonly service: YieldStatisticsService, private readonly sequelize: Sequelize) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, pagination, loadModel)
    return result
  }

  @ApiOperation({ summary: '导出' })
  @HttpCode(HttpStatus.OK)
  @Post('/export')
  async export(@Body() dto: FindPaginationDto, @Res() response: Response, @Req() req) {
    let { factoryCode, loadModel } = req
    const sheetName = `${dayjs().format('YYYY-MM-DD')}产量统计`
    let rows = await this.service.export(dto, loadModel)
    const { filePath, buffer } = await Aide.exportSheets(sheetName, rows, true)
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.setHeader('Content-Disposition', 'attachment; filename=' + encodeURI(`${sheetName}.xlsx`))
    response.setHeader('Content-Length', buffer.length)
    response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    response.send(buffer)
  }
}
