import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ProcessTask } from '@model/production/processTask.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({
    description: '工单编号',
    type: Number,
    required: false,
  })
  orderCode: number

  @ApiProperty({
    description: '产品编号',
    type: Number,
    required: false,
  })
  materialCode: number

  @ApiProperty({
    description: '产品名称',
    type: Number,
    required: false,
  })
  materialName: number

  @ApiProperty({
    description: '工序名称',
    type: Number,
    required: false,
  })
  processName: number

  @ApiProperty({
    description: '计划开始时间',
    type: Date,
    required: false,
  })
  startTime: Date

  @ApiProperty({
    description: '计划结束时间',
    type: Date,
    required: false,
  })
  endTime: Date

  @ApiProperty({
    type: String,
    required: true,
    description: '时间类型(本月,本周)',
  })
  timeType: string
}

export class priorityDto {
  @ApiProperty({ required: false, description: '优先级', type: String })
  priority: string
}

export class CProcessTaskDto {
  @ApiProperty({
    description: '工单ID',
    type: String,
    required: true,
  })
  @IsNotEmpty({ message: '工单ID不能为空' })
  productionOrderId: string

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: true,
  })
  @IsNotEmpty({ message: '工序ID不能为空' })
  processId: number

  @ApiProperty({
    description: '部门ID数组',
    type: [Number],
    required: true,
  })
  @IsNotEmpty({ message: '报工不能为空' })
  depts: number[]

  @ApiProperty({
    description: '报工数比例',
    type: Number,
    required: true,
    default: 1,
  })
  reportRatio: number

  @ApiProperty({
    description: '计划数',
    type: Number,
    required: true,
  })
  planCount: number

  @ApiProperty({
    description: '良品数',
    type: Number,
    required: false,
  })
  goodCount: number

  @ApiProperty({
    description: '不良品数',
    type: Number,
    required: false,
  })
  badCount: number

  @ApiProperty({
    description: '单位',
    type: String,
    required: true,
  })
  unit: string

  @ApiProperty({
    description: '工序状态',
    enum: ['未开始', '执行中', '已结束'],
    required: true,
  })
  status: string

  @ApiProperty({
    description: '是否委外（否/是）',
    type: Boolean,
    required: false,
    default: false,
  })
  isOutsource: boolean

  @ApiProperty({
    description: '优先级',
    enum: ['加急', '普通', '暂停', '无'],
    required: false,
    default: '无',
  })
  priority: string

  @ApiProperty({
    description: '计划开始时间',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '计划结束时间',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '实际开始时间',
    type: Date,
    required: false,
  })
  actualStartTime: Date

  @ApiProperty({
    description: '实际结束时间',
    type: Date,
    required: false,
  })
  actualEndTime: Date

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string
}

export class UProcessTaskDto {
  @ApiProperty({
    description: '序列号ID',
    type: String,
    required: true,
  })
  serialId: number

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: true,
  })
  processId: number

  @ApiProperty({
    description: '部门ID数组',
    type: [Number],
    required: true,
  })
  @IsNotEmpty({ message: '报工不能为空' })
  depts: number[]

  @ApiProperty({
    description: '报工数比例',
    type: Number,
    required: true,
    default: 1,
  })
  reportRatio: number

  @ApiProperty({
    description: '计划数',
    type: Number,
    required: true,
  })
  planCount: number

  @ApiProperty({
    description: '良品数',
    type: Number,
    required: false,
  })
  goodCount: number

  @ApiProperty({
    description: '不良品数',
    type: Number,
    required: false,
  })
  badCount: number

  @ApiProperty({
    description: '单位',
    type: String,
    required: false,
  })
  unit: string

  @ApiProperty({
    description: '工序状态',
    enum: ['未开始', '执行中', '已结束'],
    required: true,
  })
  status: string

  @ApiProperty({
    description: '是否委外（否/是）',
    type: Boolean,
    required: false,
    default: false,
  })
  isOutsource: boolean

  @ApiProperty({
    description: '优先级',
    enum: ['加急', '普通', '暂停', '无'],
    required: false,
    default: '无',
  })
  priority: string

  @ApiProperty({
    description: '计划开始时间',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '计划结束时间',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '实际开始时间',
    type: Date,
    required: false,
  })
  actualStartTime: Date

  @ApiProperty({
    description: '实际结束时间',
    type: Date,
    required: false,
  })
  actualEndTime: Date

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string
}
