import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Get, HttpCode, HttpStatus, Query, Req } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { SYSBusinessLogService } from '../services/SYSBusinessLog.service'
import { FindPaginationDto } from '../dtos/SYSBusinessLog.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'
import { OpenAuthorize } from '@core/decorator/metaData'

@ApiTags('业务操作日志')
@ApiBearerAuth()
@AdminAuth('SYSBusinessLog')
@OpenAuthorize()
export class SYSBusinessLogController {
  constructor(private readonly service: SYSBusinessLogService, private readonly sequelize: Sequelize) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    let { factoryCode, loadModel } = req
    const result = await this.service.findPagination(dto, pagination, loadModel)
    return result
  }
}
