import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Get, HttpCode, HttpStatus, Param, Post, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProcessTaskService } from './processTask.service'
import { BatchStartWorkDto, FindPaginationDto, MaterialUrgingOrderDto, StartWorkDto } from './processTask.dto'
import { CurrentPage } from '@core/decorator/request'
import { NotifyService } from '@modules/admin/notify/notify.service'
import { NotifyPageDto } from '@modules/admin/notify/notify.dto'

@ApiTags('工序任务单')
@ApiBearerAuth()
@StationAuth('processTask')
export class ProcessTaskController {
  constructor(private readonly service: ProcessTaskService, private readonly notifyService: NotifyService) {}
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: Number })
  @Get('find/:id')
  async find(@Param() param, @Req() req) {
    const result = await this.service.find(param.id)
    return result
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findPagination(dto, pagination)
    return result
  }

  @ApiOperation({ summary: '批量开工' })
  @HttpCode(HttpStatus.OK)
  @Post('batchStartWork')
  async batchStartWork(@Body() dto: BatchStartWorkDto, @Req() req) {
    const result = await this.service.batchStartWork(dto)
    return result
  }

  @ApiOperation({ summary: '开工' })
  @HttpCode(HttpStatus.OK)
  @Post('startWork')
  async startWork(@Body() dto: StartWorkDto, @Req() req) {
    const result = await this.service.startWork(dto)
    return result
  }

  @ApiOperation({ summary: '暂停工序' })
  @HttpCode(HttpStatus.OK)
  @Post('pause')
  async batchBatchPauseWork(@Body() dto: BatchStartWorkDto) {
    return this.service.batchBatchPauseWork(dto)
  }

  @ApiOperation({ summary: '恢复工序' })
  @HttpCode(HttpStatus.OK)
  @Post('resume')
  async batchResumeWork(@Body() dto: BatchStartWorkDto) {
    return this.service.batchResumeWork(dto)
  }

  @ApiOperation({ summary: '物料催单' })
  @HttpCode(HttpStatus.OK)
  @Post('material/urging')
  async materialUrgingOrder(@Body() dto: MaterialUrgingOrderDto, @Req() req) {
    dto.teamId = req.team.id
    return this.service.materialUrgingOrder(dto, req)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取物料工艺路线' })
  @ApiParam({ name: 'id', required: true, description: '物料id', type: Number })
  @Get('material/route/:id')
  async getProcessRouteList(@Param('id') id: number) {
    return this.service.getProcessRouteList(id)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '通知列表' })
  @Get('notify')
  async notifyPage(@Query() dto: NotifyPageDto, @CurrentPage() pagination: Pagination, @Req() req) {
    dto.teamId = req.team.id
    return this.notifyService.notifyPage(dto, pagination)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '工序详情' })
  @ApiParam({ name: 'id', required: true, description: '工序id', type: Number })
  @Get('process/:id')
  async processFind(@Param() Param) {
    const result = await this.service.processFind(Param.id)
    return result
  }
}
