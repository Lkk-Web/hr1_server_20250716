import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { InboundOrder } from '@model/wm/inboundOrder.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '入库单号',
    type: String,
    required: false,
  })
  code: string

  @ApiProperty({
    description: '入库类型',
    type: String,
    example: '采购入库',
    required: false,
  })
  type: string

  @ApiProperty({
    description: '入库时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  inboundTime: Date

  @ApiProperty({
    description: '供应商',
    type: String,
    required: false,
  })
  supplier: string

  @ApiProperty({
    description: '客户',
    type: String,
    required: false,
  })
  customer: string

  @ApiProperty({
    description: '仓库',
    type: String,
    required: false,
  })
  warehouse: string
}

export class flowDto{
  @ApiProperty({
    description: '单据编号',
    type: String,
    required: false,
  })
  code: string

  @ApiProperty({
    description: '库存类型',
    type: String,
    required: false,
  })
  type: string

  @ApiProperty({
    description: '单据类型',
    type: String,
    required: false,
  })
  docType: string

  @ApiProperty({
    description: '单据时间',
    type: Date,
    required: false,
  })
  orderTime: Date

  @ApiProperty({
    description: '产品名称',
    type: String,
    required: false,
  })
  materialName: string

  @ApiProperty({
    description: '产品编号',
    type: String,
    required: false,
  })
  materialCode: string

  @ApiProperty({
    description: '仓库',
    type: String,
    required: false,
  })
  warehouse: string


}

export class InboundOrderDetailDto {
  @ApiProperty({
    description: '物料Id',
    type: Number,
    required: false,
  })
  materialId: number



  @ApiProperty({
    description: '入库数量',
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
  batNum: number;
}

export class CInboundOrderDto {
  @ApiProperty({
    description: '入库单号',
    type: String,
    example: 'INB12345',
    required: false,
  })
  code: string

  @ApiProperty({
    description: '入库类型',
    type: String,
    example: '采购入库',
    required: true,
  })
  type: string

  @ApiProperty({
    description: '入库时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  inboundTime: Date

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

  @ApiProperty({
    description: '入库明细数组',
    type: [InboundOrderDetailDto],
    required: false,
  })
  details: InboundOrderDetailDto[]

  @ApiProperty({
    description: '来源单据',
    type: String,
    required: false,
  })
  originCode: string
}

export class UInboundOrderDto {
  @ApiProperty({
    description: '入库类型',
    type: String,
    example: '采购入库',
    required: true,
  })
  type: string

  @ApiProperty({
    description: '入库时间',
    type: Date,
    example: '2024-10-21T10:20:30Z',
    required: false,
  })
  inboundTime: Date

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

  @ApiProperty({
    description: '入库明细数组',
    type: [InboundOrderDetailDto],
    required: false,
  })
  details: InboundOrderDetailDto[]

  @ApiProperty({
    description: '来源单据',
    type: String,
    required: false,
  })
  originCode: string
}
