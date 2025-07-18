import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Pagination } from '@common/interface'
import { Get, HttpCode, HttpStatus, Query, Req } from '@nestjs/common'
import { StationAuth } from '@core/decorator/controller'
import { ProductionOrderService } from './productionOrder.service'
import { ProductionOrderPageDto } from './productionOrder.dto'
import { CurrentPage } from '@core/decorator/request'

@ApiTags('生产工单')
@ApiBearerAuth()
@StationAuth('productionOrder')
export class ProductionOrderController {
  constructor(private readonly service: ProductionOrderService) {}

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '列表' })
  @Get()
  async findPagination(@Query() dto: ProductionOrderPageDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const result = await this.service.findPagination(dto, pagination, req.process.id)
    return result
  }
}
