import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '出库单号',
    type: String,
    example: 'CK12345',
    required: false,
  })
  code: string

  @ApiProperty({
    description: '出库类型',
    type: String,
    example: '销售出库',
    required: false,
  })
  type: string

  @ApiProperty({
    description: '出库时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  outboundTime: Date

  @ApiProperty({
    description: '供应商',
    type: Number,
    required: false,
  })
  supplier: number

  @ApiProperty({
    description: '客户',
    type: Number,
    required: false,
  })
  customer: number

  @ApiProperty({
    description: '仓库',
    type: Number,
    required: false,
  })
  warehouse: number
}

export class OutboundOrderDetailDto {
  @ApiProperty({
    description: '物料Id',
    type: Number,
    required: false,
  })
  materialId: number

  @ApiProperty({
    description: '出库数量',
    type: Number,
    required: false,
  })
  count: number

  @ApiProperty({
    name: 'batNum',
    required: false,
    description: '数量',
    type: Number,
  })
  batNum: number
}

export class COutboundOrderDto {
  @ApiProperty({
    description: '出库单号',
    type: String,
    example: 'CK12345',
    required: false,
  })
  code: string

  @ApiProperty({
    description: '出库类型',
    type: String,
    example: '销售出库',
    required: true,
  })
  type: string

  @ApiProperty({
    description: '出库时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  outboundTime: Date

  @ApiProperty({
    description: '供应商ID',
    type: Number,
    example: 1,
    required: false,
  })
  supplierId: number

  @ApiProperty({
    description: '客户ID',
    type: Number,
    example: 2,
    required: false,
  })
  customerId: number

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

  declare details: any

  @ApiProperty({
    description: '来源单据',
    type: String,
    required: false,
  })
  originCode: string
}

export class UOutboundOrderDto {
  @ApiProperty({
    description: '出库类型',
    type: String,
    example: '销售出库',
    required: true,
  })
  type: string

  @ApiProperty({
    description: '出库时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  outboundTime: Date

  @ApiProperty({
    description: '供应商ID',
    type: Number,
    example: 1,
    required: false,
  })
  supplierId: number

  @ApiProperty({
    description: '客户ID',
    type: Number,
    example: 2,
    required: false,
  })
  customerId: number

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

  declare details: any

  @ApiProperty({
    description: '来源单据',
    type: String,
    required: false,
  })
  originCode: string
}
