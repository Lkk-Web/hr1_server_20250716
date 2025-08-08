import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProductionReportService } from './productionReport.service'
import { PadRegisterDto, PickingOutboundDto } from './productionReport.dto'
import { Sequelize } from 'sequelize-typescript'
import { ProductionReportTwoService } from '@modules/station/productionReport/productionReportTwo.service'

@ApiTags('生产报工')
@ApiBearerAuth()
@StationAuth('productionReport')
export class ProductionReportController {
  constructor(private readonly service: ProductionReportService, private readonly serviceTwo: ProductionReportTwoService, private readonly sequelize: Sequelize) {}
  /*  @ApiOperation({ summary: '创建' })
  @HttpCode(HttpStatus.OK)
  @Post('/')
  async create(@Body() dto: CProductionReportDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.create(dto, req.user, loadModel)
    return result
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '修改' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Put(':id')
  async edit(@Body() dto: UProductionReportDto, @Param() params, @Req() req) {
    let { factoryCode, loadModel } = req
    const { id } = params
    const result = await this.service.edit(dto, id, req.user, loadModel)
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
  @OpenAuthorize()
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, pagination, loadModel)
    return result
  }*/

  /*  @ApiOperation({ summary: '批量报工' })
  @HttpCode(HttpStatus.OK)
  @Post('batch')
  async batch(@Body() dto: batchDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.batch(dto, req.user, loadModel)
    return result
  }*/

  @ApiOperation({
    summary: '报工',
    description: '仅支持工位任务单报工：传 processPositionTaskId',
  })
  @HttpCode(HttpStatus.OK)
  @Post('batch')
  async batch(@Body() dto: PadRegisterDto) {
    const result = await this.serviceTwo.padRegister(dto)
    return result
  }

  @ApiOperation({ summary: '测试' })
  @HttpCode(HttpStatus.OK)
  @Post('test')
  async test(@Body() dto: PickingOutboundDto) {
    return this.serviceTwo.produceStore(dto)
  }

  /*  @ApiOperation({ summary: '审核' })
  @HttpCode(HttpStatus.OK)
  @Post('audit')
  async audit(@Body() dto: auditDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.audit(dto, req.user, loadModel)
    return result
  }

  @ApiOperation({ summary: '批量删除' })
  @HttpCode(HttpStatus.OK)
  @Post('batDelete')
  async batDelete(@Body() dto: deleteIdsDto, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.batDelete(dto, loadModel)
    return result
  }*/
}
