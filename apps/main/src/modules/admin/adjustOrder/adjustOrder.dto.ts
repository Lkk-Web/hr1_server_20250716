import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AdjustOrder } from '@model/wm/adjustOrder.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '盘点单号',
    type: String,
    required: false,
  })
  code: string

  @ApiProperty({
    description: '盘点类型',
    type: String,
    required: false,
  })
  type: string

  @ApiProperty({
    description: '盘点时间',
    type: Date,
    required: false,
  })
  adjustTime: Date

  @ApiProperty({
    description: '仓库',
    type: String,
    required: false,
  })
  warehouse: string
}

export class AdjustOrderDetailDto {
  @ApiProperty({
    description: '物料Id',
    type: Number,
    required: false,
  })
  materialId: number

  @ApiProperty({
    description: '当前数量',
    type: Number,
    required: false,
  })
  currentCount: number

  @ApiProperty({
    description: '实际数量',
    type: Number,
    required: false,
  })
  count: number

  @ApiProperty({
    description: '盘盈数量',
    type: Number,
    required: false,
  })
  profitCount: number

  @ApiProperty({
    description: '盘亏数量',
    type: Number,
    required: false,
  })
  lossCount: number
}

export class CAdjustOrderDto {
  @ApiProperty({
    description: '盘点单号',
    type: String,
    example: 'TZ24100001',
    required: false,
  })
  code: string

  @ApiProperty({
    description: '盘点类型',
    type: String,
    example: '期初盘点',
    required: true,
  })
  type: string

  @ApiProperty({
    description: '盘点开始时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  startTime: Date

  @ApiProperty({
    description: '盘点结束时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  endTime: Date

  @ApiProperty({
    description: '仓库ID',
    type: Number,
    example: 3,
    required: true,
  })
  warehouseId: number

  @ApiProperty({
    description: '备注',
    type: String,
    example: '这是一个备注.',
    required: false,
  })
  remark: string

  @ApiProperty({
    description: '盘点明细数组',
    type: [AdjustOrderDetailDto],
    required: false,
  })
  details: AdjustOrderDetailDto[]
}

export class UAdjustOrderDto {
  @ApiProperty({
    description: '盘点类型',
    type: String,
    example: '期初盘点',
    required: true,
  })
  type: string

  @ApiProperty({
    description: '盘点开始时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  startTime: Date

  @ApiProperty({
    description: '盘点结束时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  endTime: Date

  @ApiProperty({
    description: '仓库ID',
    type: Number,
    example: 3,
    required: true,
  })
  warehouseId: number

  @ApiProperty({
    description: '备注',
    type: String,
    example: '这是一个备注.',
    required: false,
  })
  remark: string

  @ApiProperty({
    description: '盘点明细数组',
    type: [AdjustOrderDetailDto],
    required: false,
  })
  details: AdjustOrderDetailDto[]
}
