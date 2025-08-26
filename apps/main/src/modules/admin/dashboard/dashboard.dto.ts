import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ProductionOrderTaskStatus } from '@common/enum'

export class FindProductionOrderTaskDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '开始时间',
    type: Date,
    required: false,
  })
  startTime: Date

  @ApiProperty({
    description: '结束时间',
    type: Date,
    required: false,
  })
  endTime: Date
}

export class OrderFindPagination {
  @ApiProperty({
    description: '开始时间',
    type: Date,
    required: false,
  })
  startTime: Date

  @ApiProperty({
    description: '结束时间',
    type: Date,
    required: false,
  })
  endTime: Date
}


