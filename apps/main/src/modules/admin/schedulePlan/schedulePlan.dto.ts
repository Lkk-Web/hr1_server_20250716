import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { SchedulePlan } from '@model/sm/schedulePlan.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ description: '计划名称', type: String, required: false, })
  name: string

  @ApiProperty({ description: '轮班方式', type: String, required: false, })
  shiftType: string

  @ApiProperty({ description: '倒班方式', type: String, required: false, })
  changeType: string

  @ApiProperty({ description: '状态（启用/禁用）', type: Boolean, required: false, default: true, })
  status: boolean
}

export class TeamList {
  @ApiProperty({ name: 'teamId', type: Number, required: false, description: '班组id' })
  teamId?: number
}

export class ShiftList {
  @ApiProperty({ name: 'shiftId', type: Number, required: false, description: '排版计划id' })
  shiftId?: number

  @ApiProperty({ name: 'TeamList', type: [TeamList], required: false, description: '班组集合' })
  TeamList?: TeamList[]
}


export class CSchedulePlanDto {
  @ApiProperty({
    description: '计划名称',
    type: String,
    required: true,
  })
  name: string

  @ApiProperty({
    description: '排班日期(开始)',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '排班日期(结束)',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '日历ID',
    type: Number,
    required: true,
  })
  calendarId: number

  @ApiProperty({
    description: '轮班方式(白班/两班制/三班制)',
    type: String,
    required: true,
  })
  shiftType: string

  @ApiProperty({
    description: '倒班方式(按周,按月)',
    type: String,
    required: true,
  })
  changeType: string

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
  })
  remark?: string

  @ApiProperty({ description: '状态（启用/禁用）', type: Boolean, required: false, default: true, })
  status: boolean

  @ApiProperty({
    description: '班次集合',
    type: [ShiftList],
    required: false,
  })
  shiftLists: ShiftList[]

}

export class USchedulePlanDto {
  @ApiProperty({
    description: '计划名称',
    type: String,
    required: true,
  })
  name: string

  @ApiProperty({
    description: '排班日期(开始)',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '排班日期(结束)',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '日历ID',
    type: Number,
    required: true,
  })
  calendarId: number

  @ApiProperty({
    description: '轮班方式(白班/两班制/三班制)',
    type: String,
    required: true,
  })
  shiftType: string

  @ApiProperty({
    description: '倒班方式(按周,按月)',
    type: String,
    required: true,
  })
  changeType: string

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
  })
  remark?: string


  @ApiProperty({ description: '状态（启用/禁用）', type: Boolean, required: false, default: true, })
  status: boolean

  @ApiProperty({
    description: '班次集合',
    type: [ShiftList],
    required: false,
  })
  shiftLists: ShiftList[]
}
