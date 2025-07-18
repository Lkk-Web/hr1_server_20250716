import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { AdminAuth, ApiRes } from '@core/decorator/controller'
import { PerformanceService } from './performance.service'
import { PerformanceDetailDto, PerformanceListDto, PerformanceListRes } from './performance.dto'
import { OpenAuthorize } from '@core/decorator/metaData'
import { CurrentPage } from '@core/decorator/request'
import { Pagination } from '@common/interface'

@ApiTags('绩效工资统计')
@ApiBearerAuth()
@AdminAuth('performance')
@OpenAuthorize()
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @ApiRes(HttpStatus.OK, { type: [PerformanceListRes] })
  @ApiOperation({ summary: '工时绩效统计' })
  @Get('statistic')
  async getManHourStatistic(@Query() dto: PerformanceListDto) {
    return this.service.getManHourStatistic(dto)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '工时绩效统计明细' })
  @Get('statistic/detail')
  async getPerformanceDetail(@Query() dto: PerformanceDetailDto, @CurrentPage() pagination: Pagination) {
    return this.service.getPerformanceDetail(dto, pagination)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '工时绩效统计导出' })
  @Post('export')
  async export(@Body() dto: PerformanceListDto) {
    return this.service.export(dto)
  }
}
