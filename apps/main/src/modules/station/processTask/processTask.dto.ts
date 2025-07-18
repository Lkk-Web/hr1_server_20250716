import { IsEnum, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { NOTIFY_SCENE, PROCESS_TASK_STATUS } from '@common/enum'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({ type: String, required: false, description: '排序命令' })
  order?: string
  @ApiProperty({
    description: '工单编号',
    type: Number,
    required: false,
  })
  orderCode: number

  @ApiProperty({ type: Boolean, description: '当前工序', required: false })
  currentProcess?: boolean

  @ApiProperty({ type: String, description: '排除指定状态', required: false })
  filterStatus?: string

  @ApiProperty({ type: String, description: '工序状态', required: false,enum:PROCESS_TASK_STATUS })
  status?: PROCESS_TASK_STATUS|string

  @ApiProperty({
    description: '产品编号',
    type: Number,
    required: false,
  })
  materialCode: number

}

export class priorityDto {
  @ApiProperty({ required: false, description: '优先级', type: String })
  priority: string
}

export class CProcessTaskDto {
  @ApiProperty({
    description: '工单ID',
    type: Number,
    required: true,
  })
  @IsNotEmpty({ message: '工单ID不能为空' })
  productionOrderId: number

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
    description: '工单ID',
    type: Number,
    required: true,
  })
  productionOrderId: number

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

export class StartWorkDto {
  @ApiProperty({ type: Number, description: '工序Id', required: true })
  id: number
}

export class BatchStartWorkDto {
  @ApiProperty({ type: [Number], description: '工序Id集合', required: true })
  ids: number[]
}

export class MaterialUrgingOrderDto extends StartWorkDto{

  @ApiProperty({ type: String, description: '内容', required: true })
  @IsNotEmpty({ message: '内容不能为空' })
  content: string

  @ApiProperty({ type: String, description: '场景', required: true,enum:NOTIFY_SCENE })
  @IsEnum(NOTIFY_SCENE,{ message: 'scene错误' })
  scene: NOTIFY_SCENE

  declare teamId?:number

}
