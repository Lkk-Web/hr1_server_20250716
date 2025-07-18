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

}
