import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Get, HttpCode, HttpStatus, Param, Query, Req } from '@nestjs/common'
import { ClientAuth } from '@core/decorator/controller'
import { ProcessTaskService } from './processTask.service'
import { FindPaginationDto } from './processTask.dto'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('工序任务单')
@ApiBearerAuth()
@ClientAuth('processTask')
export class ProcessTaskController {
  constructor(private readonly service: ProcessTaskService) {}

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
    const result = await this.service.findPagination(dto, pagination, req.user)
    return result
  }
}
