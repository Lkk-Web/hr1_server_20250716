import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Get, HttpCode, HttpStatus, Param, Post, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProductionReportService } from './productionReport.service'
import { FindPaginationDto, FindPaginationReportTaskListDto, OpenTaskDto, PadRegisterDto, PickingOutboundDto } from './productionReport.dto'
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
  //  @ApiOperation({ summary: '创建' })
  // @HttpCode(HttpStatus.OK)
  // @Post('/')
  // async create(@Body() dto: CProductionReportDto, @Req() req) {
  //   let { factoryCode, loadModel } = req
  //   const result = await this.service.create(dto, req.user, loadModel)
  //   return result
  // }

  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '修改' })
  // @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  // @Put(':id')
  // async edit(@Body() dto: UProductionReportDto, @Param() params, @Req() req) {
  //   let { factoryCode, loadModel } = req
  //   const { id } = params
  //   const result = await this.service.edit(dto, id, req.user, loadModel)
  //   return result
  // }

  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '删除' })
  // @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  // @Delete(':id')
  // async delete(@Param() params, @Req() req) {
  //   let { factoryCode, loadModel } = req
  //   const { id } = params
  //   const result = await this.service.delete(id, loadModel)
  //   return result
  // }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查看工序对应 Bom / SOP 详情' })
  @ApiParam({ name: 'processId', required: true, description: 'processId', type: Number })
  @ApiQuery({ name: 'materialId', required: false, description: 'materialId', type: String })
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

  @ApiOperation({ summary: '报工', description: '' })
  @HttpCode(HttpStatus.OK)
  @Post('reportTask')
  async batch(@Body() dto: PadRegisterDto, @Req() req) {
    const result = await this.serviceTwo.reportTask(dto, req.user)
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

  @ApiOperation({ summary: '测试' })
  @HttpCode(HttpStatus.OK)
  @Post('test')
  async test(@Body() dto: PickingOutboundDto) {
    return this.serviceTwo.produceStore(dto)
  }

  //  @ApiOperation({ summary: '审核' })
  //   @HttpCode(HttpStatus.OK)
  //   @Post('audit')
  //   async audit(@Body() dto: auditDto, @Req() req) {
  //     let { factoryCode, loadModel } = req
  //     const result = await this.service.audit(dto, req.user, loadModel)
  //     return result
  //   }

  //   @ApiOperation({ summary: '批量删除' })
  //   @HttpCode(HttpStatus.OK)
  //   @Post('batDelete')
  //   async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
  //     let { factoryCode, loadModel } = req
  //     const result = await this.service.batDelete(dto, loadModel)
  //     return result
  //   }
}
