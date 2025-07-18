import { ApiProperty } from '@nestjs/swagger'
import { PaginationDto } from '@common/dto'

export class ProductionOrderPageDto extends PaginationDto{

  @ApiProperty({
    description: '工单编号',
    type: Number,
    required: false,
  })
  orderCode: number

  @ApiProperty({ type: Number, description: '当前工序',enum:[0,1], required: false })
  currentProcess?: number

  @ApiProperty({
    description: '产品编号',
    type: Number,
    required: false,
  })
  materialCode: number

}
