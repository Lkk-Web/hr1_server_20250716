import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Shift } from '@model/schedule/shift.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '班次名称',
    type: String,
    required: false,
  })
  name: string

  @ApiProperty({
    description: '班次简称',
    type: String,
    required: false,
  })
  shortName: string

  @ApiProperty({
    description: '班次状态（启用/禁用）',
    type: Boolean,
    required: false,
    default: true,
  })
  status: boolean
}

export class ShiftPeriodDto {
  @ApiProperty({
    description: '开始时间',
    type: String,
    required: true,
    example: '08:00:00',
  })
  startTime: string

  @ApiProperty({
    description: '结束时间',
    type: String,
    required: true,
    example: '17:00:00',
  })
  endTime: string

  @ApiProperty({
    description: '工作小时数',
    type: String,
    required: true,
  })
  workHours: string
}

export class CShiftDto {
  @ApiProperty({
    description: '班次名称',
    type: String,
    required: true,
  })
  name: string

  @ApiProperty({
    description: '班次简称',
    type: String,
    required: true,
  })
  shortName: string

  @ApiProperty({
    description: '班次颜色代码',
    type: String,
    required: false,
  })
  color?: string

  @ApiProperty({
    description: '班次状态（启用/禁用）',
    type: Boolean,
    required: true,
    default: true,
  })
  status: boolean

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
  })
  remark?: string

  @ApiProperty({
    description: '班次的时段列表',
    type: [ShiftPeriodDto],
    required: false,
  })
  periods?: ShiftPeriodDto[]
}

export class UShiftDto {
  @ApiProperty({
    description: '班次名称',
    type: String,
    required: true,
  })
  name: string

  @ApiProperty({
    description: '班次简称',
    type: String,
    required: true,
  })
  shortName: string

  @ApiProperty({
    description: '班次颜色代码',
    type: String,
    required: false,
  })
  color?: string

  @ApiProperty({
    description: '班次状态（启用/禁用）',
    type: Boolean,
    required: true,
    default: true,
  })
  status: boolean

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
  })
  remark?: string

  @ApiProperty({
    description: '班次的时段列表',
    type: [ShiftPeriodDto],
    required: false,
  })
  periods?: ShiftPeriodDto[]
}
