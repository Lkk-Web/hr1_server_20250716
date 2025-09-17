import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Get, HttpCode, HttpStatus, Param, Post, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProductionReportService } from './productionReport.service'
import {
  auditDto,
  BatchAuditAntireviewDto,
  FindPaginationDto,
  FindPaginationPalletReportTaskListDto,
  FindPaginationReportTaskListDto,
  OpenTaskDto,
  PadRegisterDto,
  PalletOpenTaskDto,
  PalletRegisterDto,
  PickingOutboundDto,
} from './productionReport.dto'
import { Sequelize } from 'sequelize-typescript'
import { ProductionReportTwoService } from '@modules/station/productionReport/productionReportTwo.service'
import { Pagination } from '@common/interface'
import { ApiPlatformWhitelist, OpenAuthorize } from '@core/decorator/metaData'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('生产报工')
@ApiBearerAuth()
@StationAuth('productionReport')
export class ProductionReportController {
  constructor(private readonly service: ProductionReportService, private readonly serviceTwo: ProductionReportTwoService, private readonly sequelize: Sequelize) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查看工序对应 Bom / SOP 详情/ parameters工艺参数' })
  @ApiParam({ name: 'processId', required: true, description: 'processId', type: Number })
  @ApiQuery({ name: 'materialId', required: true, description: 'materialId', type: String })
  @Get('find/:processId')
  async find(@Param() Param, @Req() req, @Query() query) {
    const result = await this.service.find(Param.processId, query)

    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '可报工列表' })
  @Get('reportTask/findPagination')
  async reportTaskList(@Query() dto: FindPaginationReportTaskListDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel, user } = req
    const result = await this.service.reportTaskList(dto, pagination, user)
    return result
  }

  //   @ApiOperation({ summary: '批量报工' })
  // @HttpCode(HttpStatus.OK)
  // @Post('batch')
  // async batch(@Body() dto: batchDto, @Req() req) {
  //   let { factoryCode, loadModel } = req
  //   const result = await this.service.batch(dto, req.user, loadModel)
  //   return result
  // }

  @Post('antireview')
  @HttpCode(HttpStatus.OK)
  @ApiPlatformWhitelist(['admin', 'station'])
  @ApiOperation({ summary: '批量反审核报工单' })
  async auditAntireview(@Body() dto: BatchAuditAntireviewDto, @Req() req: any) {
    const result = await this.service.auditAntireview(dto.ids)
    return { data: result, message: '反审核成功', code: 200 }
  }

  @ApiOperation({ summary: '开工/暂停', description: '' })
  @HttpCode(HttpStatus.OK)
  @Post('openTask')
  async openTask(@Body() dto: OpenTaskDto, @Req() req) {
    const result = await this.serviceTwo.openTask(dto, req.user)
    return {
      message: `${dto.status}成功`,
      data: result,
    }
  }

  @ApiOperation({ summary: '托盘开工/暂停', description: '' })
  @HttpCode(HttpStatus.OK)
  @Post('palletOpenTask')
  async palletOpenTask(@Body() dto: PalletOpenTaskDto, @Req() req) {
    const result = await this.serviceTwo.palletOpenTask(dto, req.user)
    return {
      message: `托盘${dto.status}成功`,
      data: result,
    }
  }

  @ApiOperation({ summary: '报工', description: '' })
  @HttpCode(HttpStatus.OK)
  @Post('reportTask')
  async batch(@Body() dto: PadRegisterDto, @Req() req) {
    const result = await this.serviceTwo.reportTask(dto, req.user)
    return result
  }

  @ApiOperation({ summary: '托盘报工', description: '' })
  @HttpCode(HttpStatus.OK)
  @Post('palletReportTask')
  async palletReportTask(@Body() dto: PalletRegisterDto, @Req() req) {
    const result = await this.serviceTwo.palletReportTask(dto, req.user)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '报工单列表' })
  @ApiPlatformWhitelist(['admin', 'station'])
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, pagination, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '托盘报工单列表' })
  @ApiPlatformWhitelist(['admin', 'station'])
  @Get('palletfindPagination')
  async palletfindPagination(@Query() dto: FindPaginationPalletReportTaskListDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { user } = req
    const result = await this.serviceTwo.palletfindPagination(dto, pagination, user)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '报工单详情' })
  @ApiParam({ name: 'id', required: true, description: '报工单ID', type: Number })
  @ApiPlatformWhitelist(['admin', 'station'])
  @Get('detail/:id')
  async findById(@Param('id') id: number, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findById(id, loadModel)
    return result
  }

  @ApiOperation({ summary: '报工审核' })
  @HttpCode(HttpStatus.OK)
  @ApiPlatformWhitelist(['admin', 'station'])
  @Post('audit')
  async audit(@Body() dto: auditDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.audit(dto, req.user, loadModel)
    return result
  }

  //   @ApiOperation({ summary: '批量删除' })
  //   @HttpCode(HttpStatus.OK)
  //   @Post('batDelete')
  //   async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
  //     let { factoryCode, loadModel } = req
  //     const result = await this.service.batDelete(dto, loadModel)
  //     return result
  //   }
}
