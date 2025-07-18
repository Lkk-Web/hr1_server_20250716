import { ApiProperty, ApiTags } from '@nestjs/swagger'
export class FindPaginationDto {
  //产品名称、规格，  工单编号、状态、名称  报工开始、结束时间
  @ApiProperty({
    description: '产品编号',
    type: String,
    required: false,
    example: 'string',
  })
  bomCode: string

  @ApiProperty({
    description: '产品名称',
    type: String,
    required: false,
    example: 'string',
  })
  bomName: string

  @ApiProperty({
    description: '产品规格',
    type: String,
    required: false,
    example: 'string',
  })
  bomSpec: string

  @ApiProperty({
    description: '工单编号',
    type: String,
    required: false,
    example: 'string',
  })
  productionOrderCode: string

  @ApiProperty({
    description: '工单状态',
    type: String,
    required: false,
    example: 'string',
  })
  productionOrderStatus: string

  @ApiProperty({
    description: '工序名称',
    type: String,
    required: false,
    example: 'string',
  })
  processName: string

  @ApiProperty({
    description: '报工开始时间',
    type: Date,
    required: false,
    example: 'time',
  })
  startTime: Date

  @ApiProperty({
    description: '报工结束时间',
    type: Date,
    required: false,
    example: 'time',
  })
  endTime: Date
}
