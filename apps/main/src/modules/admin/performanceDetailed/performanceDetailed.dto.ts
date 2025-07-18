import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string

  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ name: 'startTime', required: false, description: '开始时间', type: Date })
  startTime: string | number | any

  @ApiProperty({ name: 'endTime', required: false, description: '结束时间', type: Date })
  endTime: string | number | any

  @ApiProperty({ name: 'performanceId', required: true, description: '绩效工资统计Id', type: Number })
  performanceId?: number
}

export class CPerformanceDetailedDto {
  @ApiProperty({ name: 'materialId', required: false, description: '物料Id', type: Number })
  materialId?: number

  @ApiProperty({ name: 'processId', required: false, description: '工序Id', type: Number })
  processId?: number

  @ApiProperty({ name: 'performanceId', required: false, description: '绩效工资统计Id', type: Number })
  performanceId?: number

  @ApiProperty({ name: 'productionOrderId', required: false, description: '工单Id', type: String })
  productionOrderId?: string

  @ApiProperty({ name: 'userId', required: false, description: '用户Id', type: Number })
  userId?: number

  @ApiProperty({ name: 'goodCount', required: false, description: '良品数', type: Number })
  goodCount?: number

  @ApiProperty({ name: 'badCount', required: false, description: '不良品数', type: Number })
  badCount?: number

  @ApiProperty({ name: 'goodCountPrice', required: false, description: '良品单价（分）', type: Number })
  goodCountPrice?: number

  @ApiProperty({ name: 'badCountPrice', required: false, description: '不良品单价（分）', type: Number })
  badCountPrice: number

  @ApiProperty({ name: 'goodCountWages', required: false, description: '良品工资（秒）', type: Number })
  goodCountWages: number

  @ApiProperty({ name: 'badCountWages', required: false, description: '不良品工资（件）', type: Number })
  badCountWages: number

  @ApiProperty({ name: 'yieldRate', required: false, description: '良品率%', type: Number })
  yieldRate?: number

  @ApiProperty({ name: 'wages', required: false, description: '工资合计（分）', type: Number })
  wages: number
}

export class UPerformanceDetailedDto {
  @ApiProperty({ name: 'materialId', required: false, description: '物料Id', type: Number })
  materialId?: number

  @ApiProperty({ name: 'processId', required: false, description: '工序Id', type: Number })
  processId?: number

  @ApiProperty({ name: 'performanceId', required: false, description: '绩效工资统计Id', type: Number })
  performanceId?: number

  @ApiProperty({ name: 'productionOrderId', required: false, description: '工单Id', type: String })
  productionOrderId?: string

  @ApiProperty({ name: 'userId', required: false, description: '用户Id', type: Number })
  userId?: number

  @ApiProperty({ name: 'goodCount', required: false, description: '良品数', type: Number })
  goodCount?: number

  @ApiProperty({ name: 'badCount', required: false, description: '不良品数', type: Number })
  badCount?: number

  @ApiProperty({ name: 'goodCountPrice', required: false, description: '良品单价（分）', type: Number })
  goodCountPrice?: number

  @ApiProperty({ name: 'badCountPrice', required: false, description: '不良品单价（分）', type: Number })
  badCountPrice: number

  @ApiProperty({ name: 'goodCountWages', required: false, description: '良品工资（秒）', type: Number })
  goodCountWages: number

  @ApiProperty({ name: 'badCountWages', required: false, description: '不良品工资（件）', type: Number })
  badCountWages: number

  @ApiProperty({ name: 'yieldRate', required: false, description: '良品率%', type: Number })
  yieldRate?: number

  @ApiProperty({ name: 'wages', required: false, description: '工资合计（分）', type: Number })
  wages: number
}
