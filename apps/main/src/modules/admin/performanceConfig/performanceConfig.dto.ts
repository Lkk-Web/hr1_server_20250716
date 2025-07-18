import { IsNotEmpty, isNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  // @ApiProperty({ name: 'default', type: String, required: false, description: 'default' })
  // default?: string

  @ApiProperty({ name: 'materialName', required: false, description: '产品名称', type: String })
  materialName: string

  @ApiProperty({ name: 'processName', required: false, description: '工序名称', type: String })
  processName?: string

  @ApiProperty({ name: 'pricingMethod', required: false, description: '计价方式（计件，计时）', type: String })
  pricingMethod?: string
}

export class CPerformanceConfigDto {
  @ApiProperty({ name: 'materialId', required: true, description: '物料Id', type: Number })
  materialId?: number

  @ApiProperty({ name: 'processId', required: true, description: '工序Id', type: Number })
  processId?: number

  @ApiProperty({ name: 'pricingMethod', required: false, description: '计价方式（计件，计时）', type: String })
  pricingMethod?: string

  @ApiProperty({ name: 'goodCountPrice', required: false, description: '良品单价（分）', type: Number })
  goodCountPrice?: number

  @ApiProperty({ name: 'badCountPrice', required: false, description: '不良品单价（分）', type: Number })
  badCountPrice: number

  @ApiProperty({ name: 'canonTime', required: false, description: '标准工时（秒）', type: Number })
  canonTime: number

  @ApiProperty({ name: 'canonNum', required: false, description: '标准产出（件）', type: Number })
  canonNum: number
}

export class UPerformanceConfigDto {
  @ApiProperty({ name: 'materialId', required: false, description: '物料Id', type: Number })
  materialId?: number

  @ApiProperty({ name: 'processId', required: false, description: '工序Id', type: Number })
  processId?: number

  @ApiProperty({ name: 'pricingMethod', required: false, description: '计价方式（计件，计时）', type: String })
  pricingMethod?: string

  @ApiProperty({ name: 'goodCountPrice', required: false, description: '良品单价（分）', type: Number })
  goodCountPrice?: number

  @ApiProperty({ name: 'badCountPrice', required: false, description: '不良品单价（分）', type: Number })
  badCountPrice: number

  @ApiProperty({ name: 'canonTime', required: false, description: '标准工时（秒）', type: Number })
  canonTime: number

  @ApiProperty({ name: 'canonNum', required: false, description: '标准产出（件）', type: Number })
  canonNum: number
}
