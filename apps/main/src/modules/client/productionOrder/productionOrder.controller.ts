import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Get, HttpCode, HttpStatus, Param, Query, Req } from '@nestjs/common'
import { ClientAuth } from '@core/decorator/controller'
import { ProductionOrderService } from './productionOrder.service'
import { FindPaginationDto } from './productionOrder.dto'
import { Sequelize } from 'sequelize-typescript'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('生产工单')
@ApiBearerAuth()
@ClientAuth('productionOrder')
export class ProductionOrderController {
  constructor(private readonly service: ProductionOrderService, private readonly sequelize: Sequelize) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '详情' })
  @ApiParam({ name: 'id', required: true, description: 'id', type: String })
  @Get('find/:id')
  async find(@Param() param, @Req() req) {
    return this.service.find(param.id)
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get('findPagination')
  async findPagination(@Query() dto: FindPaginationDto, @CurrentPage() pagination: Pagination, @Req() req) {
    return this.service.findPagination(dto, pagination, req.user)
  }
}
