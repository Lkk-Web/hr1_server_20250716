import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProcessPositionTaskService } from './processPositionTask.service'
import { UpdateProcessPositionTaskDto, FindPaginationDto, BatchOperationDto, StartWorkDto, FindByTeamDto, CreateProcessLocateDto, FindByOrderDto } from './processPositionTask.dto'

@ApiTags('工位任务单')
@ApiBearerAuth()
@StationAuth('processPositionTask')
export class ProcessPositionTaskController {
  constructor(private readonly processPositionTaskService: ProcessPositionTaskService) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新工位任务单' })
  @ApiParam({ name: 'id', description: '工位任务单ID' })
  async update(@Param('id') id: number, @Body() dto: UpdateProcessPositionTaskDto, @Req() req: any) {
    const result = await this.processPositionTaskService.update(id, dto)
    return { data: result, message: '更新成功' }
  }

  // @Delete(':id')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '删除工位任务单' })
  // @ApiParam({ name: 'id', description: '工位任务单ID' })
  // async delete(@Param('id') id: number) {
  //   await this.processPositionTaskService.delete(id)
  //   return { message: '删除成功' }
  // }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取工位任务单详情' })
  @ApiParam({ name: 'id', description: '工位任务单ID' })
  async findOne(@Param('id') id: number) {
    const result = await this.processPositionTaskService.findOne(id)
    return { data: result }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '分页查询工位任务单列表' })
  async findPagination(@Query() dto: FindPaginationDto, @Query() pagination: Pagination) {
    const result = await this.processPositionTaskService.findPagination(dto, pagination)
    return result
  }

  @Get('team/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据班组查询工单带出工序任务单和工位任务单' })
  async findByTeam(@Query() dto: FindByTeamDto) {
    const result = await this.processPositionTaskService.findByTeam(dto)
    return { data: result }
  }

  @Get('order/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据工单查找其下面的工序和工位任务单' })
  async findByOrder(@Query() dto: FindByOrderDto) {
    const result = await this.processPositionTaskService.findByOrder(dto)
    return { data: result }
  }

  // @Post('start-work')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '开始工作' })
  // async startWork(@Body() dto: StartWorkDto) {
  //   await this.processPositionTaskService.startWork(dto)
  //   return { message: '开始工作成功' }
  // }

  // @Post('batch/pause')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '批量暂停任务' })
  // async batchPause(@Body() dto: BatchOperationDto) {
  //   await this.processPositionTaskService.batchPause(dto)
  //   return { message: '批量暂停成功' }
  // }

  // @Post('batch/resume')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '批量恢复任务' })
  // async batchResume(@Body() dto: BatchOperationDto) {
  //   await this.processPositionTaskService.batchResume(dto)
  //   return { message: '批量恢复成功' }
  // }

  // @Post('batch/complete')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '批量完成任务' })
  // async batchComplete(@Body() dto: BatchOperationDto) {
  //   await this.processPositionTaskService.batchComplete(dto)
  //   return { message: '批量完成成功' }
  // }

  @Post('locate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '派工' })
  async createProcessLocate(@Body() dto: CreateProcessLocateDto, @Req() req: any) {
    const assignerId = req.user.id
    const result = await this.processPositionTaskService.createProcessLocate(dto, assignerId)
    return { data: result, message: '派工成功' }
  }

  @Get('locate/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询派工单列表' })
  async findProcessLocateList(@Query() pagination: Pagination) {
    const result = await this.processPositionTaskService.findProcessLocateList(pagination)
    return result
  }

  @Get('locate/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取派工单详情' })
  @ApiParam({ name: 'id', description: '派工单ID' })
  async findProcessLocateDetail(@Param('id') id: number) {
    const result = await this.processPositionTaskService.findProcessLocateDetail(id)
    return { data: result }
  }
}
