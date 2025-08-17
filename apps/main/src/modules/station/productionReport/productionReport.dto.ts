import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Min, ValidateNested, IsOptional, isEnum, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { IsArrayLength } from '@library/utils/custom'
import { POSITION_TASK_STATUS, TaskStatus } from '@common/enum'

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
    required: false,
    description: '时间类型(本月,本周)',
  })
  timeType: string

  @ApiProperty({
    description: '计件方式 (计件 / 计时)',
    type: String,
    required: false,
  })
  accountingType: string

  @ApiProperty({
    description: '审核状态 (已审核 / 未审核)',
    type: String,
    required: false,
  })
  auditStatus: string
}

export class FindPaginationReportTaskListDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string

  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '父工序id',
    required: false,
  })
  processId: number

  @ApiProperty({
    description: '工位工序id',
    required: false,
  })
  positioProcessId: number

  @ApiProperty({
    description: '工序状态',
    required: false,
  })
  @IsEnum(POSITION_TASK_STATUS)
  status: string
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
  productionOrderTaskId: number

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

  @ApiProperty({
    type: Boolean,
    required: false,
    description: '是否进行质检',
  })
  isInspection: boolean

  @ApiProperty({
    description: '报工数量',
    type: Number,
    required: true,
  })
  reportQuantity: number
}

export class UProductionReportDto {
  @ApiProperty({
    description: '工单任务单ID',
    type: Number,
    required: true,
  })
  productionOrderTaskId: number

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

  @ApiProperty({ required: false, description: '校验类型', type: String })
  type: string

  @ApiProperty({
    type: Boolean,
    required: false,
    description: '是否进行质检',
  })
  isInspection: boolean
}

export class batchDto {
  @ApiProperty({
    description: '报工DTO数组',
    type: [CProductionReportDto],
    required: false,
  })
  dtos?: CProductionReportDto[]
}

export class auditDto {
  @ApiProperty({ required: false, description: '状态(已通过，已驳回)', type: String })
  status: string

  @ApiProperty({
    description: 'id数组',
    type: [Number],
    required: false,
  })
  ids?: number[]
}

export class PadProcessDto {
  @ApiProperty({ description: '序列号id', type: Number, required: true })
  @IsNumber({}, { message: '序列号id必须为数字' })
  serialId: number

  @ApiProperty({ description: '报工数量，数量应都为1', type: Number })
  @IsNumber({}, { message: '报工数量必须为数字' })
  @Min(1, { message: '报工数量必须大于0' })
  reportQuantity: number

  @ApiProperty({ description: '所用时长 单位/s', type: Number, required: false })
  duration: number

  @ApiProperty({
    description: '铁芯序列号',
    required: false,
    type: String,
  })
  ironSerial?: string

  @ApiProperty({
    description: '质检结果',
    required: false,
    type: Boolean,
  })
  QCResult?: boolean

  @ApiProperty({
    description: '质检原因',
    required: false,
    type: String,
  })
  QCReason?: string
}

export class ProductionOrderTaskDto {
  @ApiProperty({ description: '工单id', type: Number, required: true })
  @IsNumber({}, { message: '工位任务单id必须为数字' })
  productionOrderTaskId: number

  @ApiProperty({ description: '工位任务单配置', type: [PadProcessDto] })
  @Type(() => PadProcessDto)
  @ValidateNested({ each: true })
  @IsArrayLength({ min: 1 }, { message: '工序配置必须是数组且长度大于0' })
  positions: PadProcessDto[]
}

export class PadRegisterDto {
  @ApiProperty({ description: '工单配置', type: [ProductionOrderTaskDto] })
  @Type(() => ProductionOrderTaskDto)
  @ValidateNested({ each: true })
  @IsArrayLength({ min: 1 }, { message: '工单配置必须是数组且长度大于0' })
  productionOrderTask: ProductionOrderTaskDto[]

  @ApiProperty({
    description: '工序id',
    required: true,
  })
  processId: number

  @ApiProperty({
    description: '班组id',
    required: true,
  })
  teamId: number
}

export class OpenTaskDto {
  @ApiProperty({ description: '工单配置', type: [ProductionOrderTaskDto] })
  @Type(() => ProductionOrderTaskDto)
  @ValidateNested({ each: true })
  @IsArrayLength({ min: 1 }, { message: '工单配置必须是数组且长度大于0' })
  productionOrderTask: ProductionOrderTaskDto[]

  @ApiProperty({
    description: '工序id',
    required: true,
  })
  processId: number

  @ApiProperty({ description: '状态: 开工/暂停', required: true, enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: string
}

export class PickingOutboundDto {
  @ApiProperty({
    type: String,
    description: '生产工单id',
    required: false,
  })
  serialId?: number

  @ApiProperty({
    type: Number,
    description: '良品数',
    required: false,
  })
  goodCount: number

  @ApiProperty({
    type: Number,
    description: '不良品数',
    required: false,
  })
  badCount: number

  taskId?: number // 当前工序任务单ID 检测是否为最后一工序
}
