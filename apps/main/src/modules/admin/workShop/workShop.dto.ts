import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { WorkShop } from '@model/base/workShop.model'
import { Type } from 'class-transformer'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({
    description: '车间名称',
    type: String,
    required: false,
    example: '车间A',
  })
  name: string

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: false,
    example: true,
  })
  status: boolean
}

export class CWorkShopDto {
  @ApiProperty({
    description: '车间名称',
    type: String,
    required: true,
    example: '车间A',
  })
  name: string

  @ApiProperty({
    description: '负责人 ID',
    type: Number,
    required: true,
    example: 1,
  })
  chargeId: number

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: true,
    example: true,
  })
  status: boolean

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
    example: '这是一个示例备注。',
  })
  remark: string
}

export class UWorkShopDto {
  @ApiProperty({
    description: '车间名称',
    type: String,
    required: true,
    example: '车间A',
  })
  name: string

  @ApiProperty({
    description: '负责人 ID',
    type: Number,
    required: true,
    example: 1,
  })
  chargeId: number

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: true,
    example: true,
  })
  status: boolean

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
    example: '这是一个示例备注。',
  })
  remark: string
}

export class FindPaginationScheduleDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ required: false, description: '开始时间' })
  startTime?: Date

  @ApiProperty({ required: false, description: '结束时间' })
  endTime?: Date
}

export class ScheduleList {
  @ApiProperty({
    description: '排程开始时间 YYYY-MM-DD HH:mm:ss',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '排程结束时间 YYYY-MM-DD HH:mm:ss',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '工序Id',
    type: Number,
    required: true,
  })
  processId: number

  @ApiProperty({ description: '子工序', type: [ScheduleList], required: false })
  subProcessList?: ScheduleList[]
}

export class ScheduleDto {
  @ApiProperty({ description: '排产列表', type: [ScheduleList] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleList)
  scheduleList: ScheduleList[]

  @ApiProperty({
    description: '工单Id',
    type: Number,
    required: true,
  })
  productionOrderTaskId: number
}

export class ScheduleDetailDto {
  @ApiProperty({
    description: '生产订单任务ID',
    type: Number,
    required: true,
    example: 1,
  })
  @IsNotEmpty({ message: '生产订单任务ID不能为空' })
  productionOrderTaskId: number
}
