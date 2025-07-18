import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common'
import { AdminAuth } from '@core/decorator/controller'
import { NotifyService } from './notify.service'
import { NotifyPageDto } from './notify.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('通知管理')
@ApiBearerAuth()
@AdminAuth('notify')
export class NotifyController {
  constructor(private readonly service: NotifyService, private readonly sequelize: Sequelize) {}

  @ApiOperation({ summary: '通知已读' })
  @HttpCode(HttpStatus.OK)
  @Put('read/:id')
  async create(@Param('id') id: number) {
    return this.service.read(id)
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '通知列表' })
  @Get('')
  async notifyPage(@Query() dto: NotifyPageDto, @CurrentPage() pagination: Pagination) {
    return this.service.notifyPage(dto, pagination)
  }
}
