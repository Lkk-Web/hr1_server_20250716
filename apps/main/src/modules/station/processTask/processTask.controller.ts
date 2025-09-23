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
    return { data: result, code: 200 }
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findPagination(dto, pagination)
    return { data: result, code: 200 }
  }

  @ApiOperation({ summary: '暂停工序' })
  @HttpCode(HttpStatus.OK)
  @Post('pause')
  async batchBatchPauseWork(@Body() dto: BatchStartWorkDto) {
    return { data: this.service.batchBatchPauseWork(dto), code: 200 }
  }

  @ApiOperation({ summary: '恢复工序' })
  @HttpCode(HttpStatus.OK)
  @Post('resume')
  async batchResumeWork(@Body() dto: BatchStartWorkDto) {
    return { data: this.service.batchResumeWork(dto), code: 200 }
  }

  @ApiOperation({ summary: '物料催单' })
  @HttpCode(HttpStatus.OK)
  @Post('material/urging')
  async materialUrgingOrder(@Body() dto: MaterialUrgingOrderDto, @Req() req) {
    dto.teamId = req.team.id
    return { data: this.service.materialUrgingOrder(dto, req), code: 200 }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取物料工艺路线' })
  @ApiParam({ name: 'id', required: true, description: '物料id', type: Number })
  @Get('material/route/:id')
  async getProcessRouteList(@Param('id') id: number) {
    return { data: this.service.getProcessRouteList(id), code: 200 }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '通知列表' })
  @Get('notify')
  async notifyPage(@Query() dto: NotifyPageDto, @CurrentPage() pagination: Pagination, @Req() req) {
    dto.teamId = req.team.id
    return { data: this.notifyService.notifyPage(dto, pagination), code: 200 }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '工序详情' })
  @ApiParam({ name: 'id', required: true, description: '工序id', type: Number })
  @Get('process/:id')
  async processFind(@Param() Param) {
    const result = await this.service.processFind(Param.id)
    return { data: result, code: 200 }
  }
}
