import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '工单ID',
    type: Number,
    required: false,
  })
  orderId: number

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: false,
  })
  processId: number

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
    description: '审核状态 (已审核 / 未审核)',
    type: String,
    required: false,
  })
  auditStatus: string
}

export class ItemsDto {
  @ApiProperty({ type: Number, required: false, description: '不良品项ID' })
  defectiveItemId: number

  @ApiProperty({ type: Number, required: false, description: '不良品项数量' })
  count: number
}

export class CProductionReportDto {
  @ApiProperty({
    description: '工单ID',
    type: Number,
    required: true,
  })
  orderId: number

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: true,
  })
  processId: number

  @ApiProperty({
    description: '工序任务单ID',
    type: Number,
    required: true,
  })
  taskId: number

  // @ApiProperty({
  //   description: '工序状态（未开始，执行中, 已结束）',
  //   type: String,
  //   required: false,
  // })
  // processStatus?: string

  @ApiProperty({
    description: '生产人员ID',
    type: Number,
    required: false,
  })
  productUserId?: number

  @ApiProperty({
    description: '开始时间',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '结束时间',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '报工时长（小时）',
    type: Number,
    required: true,
  })
  reportDurationHours?: number

  @ApiProperty({
    description: '报工时长（分钟）',
    type: Number,
    required: true,
  })
  reportDurationMinutes?: number

  @ApiProperty({
    description: '报工数量',
    type: Number,
    required: true,
  })
  reportQuantity: number

  @ApiProperty({
    description: '良品数',
    type: Number,
    required: true,
  })
  goodCount?: number

  @ApiProperty({
    description: '不良品数',
    type: Number,
    required: false,
  })
  badCount?: number

  @ApiProperty({
    description: '不良品项数组',
    type: [ItemsDto],
    required: false,
  })
  items?: ItemsDto[]

  // @ApiProperty({
  //   description: '工序进度',
  //   type: String,
  //   required: false,
  // })
  // processProgress?: string

  // @ApiProperty({
  //   description: '达标率',
  //   type: Number,
  //   required: false,
  // })
  // complianceRate?: number

  @ApiProperty({
    description: '计件方式 (计件 / 计时)',
    type: String,
    required: false,
  })
  accountingType: string

  @ApiProperty({
    name: 'goodCountPrice',
    required: false,
    description: '良品单价（分）',
    type: Number,
  })
  goodCountPrice?: number

  @ApiProperty({
    name: 'badCountPrice',
    required: false,
    description: '不良品单价（分）',
    type: Number,
  })
  badCountPrice: number

  @ApiProperty({
    description: '预计工资',
    type: Number,
    required: false,
  })
  estimatedWage?: number

  @ApiProperty({ name: 'canonTime', required: false, description: '标准工时（秒）', type: Number })
  canonTime: number

  @ApiProperty({ name: 'canonNum', required: false, description: '标准产出（件）', type: Number })
  canonNum: number

  @ApiProperty({ required: false, description: '优先级', type: String })
  priority: string
}

export class UProductionReportDto {
  @ApiProperty({
    description: '工单ID',
    type: Number,
    required: true,
  })
  orderId: number

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: true,
  })
  processId: number

  @ApiProperty({
    description: '工序任务单ID',
    type: Number,
    required: true,
  })
  taskId: number

  // @ApiProperty({
  //   description: '工序状态（未开始，执行中, 已结束）',
  //   type: String,
  //   required: false,
  // })
  // processStatus?: string

  @ApiProperty({
    description: '生产人员ID',
    type: Number,
    required: false,
  })
  productUserId?: number

  @ApiProperty({
    description: '开始时间',
    type: Date,
    required: true,
  })
  startTime: Date

  @ApiProperty({
    description: '结束时间',
    type: Date,
    required: true,
  })
  endTime: Date

  @ApiProperty({
    description: '报工时长（小时）',
    type: Number,
    required: true,
  })
  reportDurationHours?: number

  @ApiProperty({
    description: '报工时长（分钟）',
    type: Number,
    required: true,
  })
  reportDurationMinutes?: number

  @ApiProperty({
    description: '报工数量',
    type: Number,
    required: true,
  })
  reportQuantity: number

  @ApiProperty({
    description: '良品数',
    type: Number,
    required: true,
  })
  goodCount?: number

  @ApiProperty({
    description: '不良品数',
    type: Number,
    required: false,
  })
  badCount?: number

  @ApiProperty({
    description: '不良品项数组',
    type: [ItemsDto],
    required: false,
  })
  items?: ItemsDto[]

  // @ApiProperty({
  //   description: '工序进度',
  //   type: String,
  //   required: false,
  // })
  // processProgress?: string

  // @ApiProperty({
  //   description: '达标率',
  //   type: Number,
  //   required: false,
  // })
  // complianceRate?: number

  @ApiProperty({
    description: '计件方式 (计件 / 计时)',
    type: String,
    required: false,
  })
  accountingType: string

  @ApiProperty({
    name: 'goodCountPrice',
    required: false,
    description: '良品单价（分）',
    type: Number,
  })
  goodCountPrice?: number

  @ApiProperty({
    name: 'badCountPrice',
    required: false,
    description: '不良品单价（分）',
    type: Number,
  })
  badCountPrice: number

  @ApiProperty({
    description: '预计工资',
    type: Number,
    required: false,
  })
  estimatedWage?: number

  @ApiProperty({ name: 'canonTime', required: false, description: '标准工时（秒）', type: Number })
  canonTime: number

  @ApiProperty({ name: 'canonNum', required: false, description: '标准产出（件）', type: Number })
  canonNum: number

  @ApiProperty({ required: false, description: '优先级', type: String })
  priority: string
}

export class batchDto {
  @ApiProperty({
    description: '审核人',
    type: [CProductionReportDto],
    required: false,
  })
  dtos?: CProductionReportDto[]
}
