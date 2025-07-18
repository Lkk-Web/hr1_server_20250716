import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Calendar } from '@model/sm/calendar.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ description: '日历名称', type: String, required: false, })
  name: string

  @ApiProperty({ description: '状态（启用/禁用）', type: Boolean, required: false, default: true, })
  status: boolean
}

export class CalendarDetailDto {
  @ApiProperty({ description: '生效时间', type: Date, required: true })
  effectiveDate: Date

  @ApiProperty({ description: '失效时间', type: Date, required: true })
  expireDate: Date

  @ApiProperty({ description: '工作日数组，0表示周日，1表示周一，以此类推', type: [String], required: false, default: ['1', '2', '3', '4', '5'] })
  workDays: [string]

  @ApiProperty({ description: '是否按法定节假日排休（否，是）', type: String, required: false })
  state: string
}

export class DetailList {
  @ApiProperty({ description: '日期', type: Date, required: true })
  dayDate: Date

  @ApiProperty({ description: '是否上班', type: Boolean, required: false, default: true })
  state: boolean
}

export class CCalendarDto {
  @ApiProperty({ description: '日历名称', type: String, required: true })
  name: string

  @ApiProperty({ description: '生效时间', type: Date, required: true })
  effectiveDate: Date

  @ApiProperty({ description: '失效时间', type: Date, required: true })
  expireDate: Date

  @ApiProperty({ description: '是否按法定节假日排休', type: Boolean, required: false, default: true })
  state: boolean

  @ApiProperty({ description: '状态（启用/禁用）', type: Boolean, required: false, default: true })
  status: boolean

  declare calendarDetails?: any
}

export class UCalendarDto {
  @ApiProperty({ description: '日历名称', type: String, required: true })
  name: string

  @ApiProperty({ description: '生效时间', type: Date, required: true })
  effectiveDate: Date

  @ApiProperty({ description: '失效时间', type: Date, required: true })
  expireDate: Date

  @ApiProperty({ description: '是否按法定节假日排休', type: Boolean, required: false, default: true })
  state: boolean

  @ApiProperty({ description: '状态（启用/禁用）', type: Boolean, required: false, default: true })
  status: boolean

  declare calendarDetails?: any
}
