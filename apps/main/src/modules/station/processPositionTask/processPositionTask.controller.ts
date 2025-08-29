import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Body, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProcessPositionTaskService } from './processPositionTask.service'
import {
  UpdateProcessPositionTaskDto,
  FindPaginationDto,
  FindByTeamDto,
  CreateProcessLocateDto,
  FindByOrderDto,
  FindProcessLocatePaginationDto,
  BatchAuditProcessLocateDto,
} from './processPositionTask.dto'
import { CurrentPage } from '@core/decorator/request'
import { ApiPlatformWhitelist } from '@core/decorator/metaData'

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
  @ApiOperation({ summary: '查询工单带出可派工列表' })
  async findByTeam(@Query() dto: FindByTeamDto, @Req() req) {
    const result = await this.processPositionTaskService.findByTeam(dto, req.user.id)
    return { data: result }
  }

  // @Get('order/query')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: '根据工单和工序查找序列号' })
  // async findByOrder(@Query() dto: FindByOrderDto) {
  //   const result = await this.processPositionTaskService.findByOrder(dto)
  //   return { data: result }
  // }

  @Post('locate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '派工' })
  async createProcessLocate(@Body() dto: CreateProcessLocateDto, @Req() req: any) {
    const assignerId = req.user.id
    const result = await this.processPositionTaskService.createProcessLocate(dto, assignerId)
    return { data: result, message: '派工成功', code: 200 }
  }

  @Get('locate/list')
  @HttpCode(HttpStatus.OK)
  @ApiPlatformWhitelist(['admin', 'station'])
  @ApiOperation({ summary: '查询派工单列表' })
  async findProcessLocateList(@Query() dto: FindProcessLocatePaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.processPositionTaskService.findProcessLocateList(dto, pagination)
    return { data: result, code: 200 }
  }

  @Get('locate/:id')
  @HttpCode(HttpStatus.OK)
  @ApiPlatformWhitelist(['admin', 'station'])
  @ApiOperation({ summary: '获取派工单详情' })
  @ApiParam({ name: 'id', description: '派工单ID' })
  async findProcessLocateDetail(@Param('id') id: number) {
    const result = await this.processPositionTaskService.findProcessLocateDetail(id)
    return { data: result, code: 200 }
  }

  @Post('locate/audit')
  @HttpCode(HttpStatus.OK)
  @ApiPlatformWhitelist(['admin', 'station'])
  @ApiOperation({ summary: '批量审核派工单' })
  async auditProcessLocate(@Body() dto: BatchAuditProcessLocateDto, @Req() req: any) {
    const auditorId = req.user.id
    const result = await this.processPositionTaskService.auditProcessLocate(dto.ids, dto.audit, auditorId)
    return { data: result, message: '审核成功', code: 200 }
  }
}
