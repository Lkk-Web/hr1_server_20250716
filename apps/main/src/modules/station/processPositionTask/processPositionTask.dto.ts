import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean, IsArray } from 'class-validator'
import { PROCESS_TASK_STATUS, AuditStatus, POSITION_TASK_STATUS } from '@common/enum'

export class UpdateProcessPositionTaskDto {
  @ApiProperty({ type: Number, description: '操作工ID', required: false })
  @IsOptional()
  @IsNumber({}, { message: '操作工ID必须是数字' })
  userId?: number

  @ApiProperty({ type: Number, description: '报工数比例', required: false })
  @IsOptional()
  @IsNumber({}, { message: '报工数比例必须是数字' })
  reportRatio?: number

  @ApiProperty({ type: Number, description: '计划数', required: false })
  @IsOptional()
  @IsNumber({}, { message: '计划数必须是数字' })
  planCount?: number

  @ApiProperty({ type: Number, description: '良品数', required: false })
  @IsOptional()
  @IsNumber({}, { message: '良品数必须是数字' })
  goodCount?: number

  @ApiProperty({ type: Number, description: '不良品数', required: false })
  @IsOptional()
  @IsNumber({}, { message: '不良品数必须是数字' })
  badCount?: number

  @ApiProperty({ type: String, description: '单位', required: false })
  @IsOptional()
  @IsString({ message: '单位必须是字符串' })
  unit?: string

  @ApiProperty({ type: String, description: '任务状态', required: false })
  @IsOptional()
  @IsString({ message: '任务状态必须是字符串' })
  status?: POSITION_TASK_STATUS

  @ApiProperty({ type: Boolean, description: '是否委外', required: false })
  @IsOptional()
  @IsBoolean({ message: '是否委外必须是布尔值' })
  isOutsource?: boolean

  @ApiProperty({ type: Boolean, description: '是否进行质检', required: false })
  @IsOptional()
  @IsBoolean({ message: '是否进行质检必须是布尔值' })
  isInspection?: boolean
}

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: Number, description: '工序任务单ID', required: false })
  @IsOptional()
  @IsNumber({}, { message: '工序任务单ID必须是数字' })
  processTaskId?: number

  @ApiProperty({ type: Number, description: '操作工ID', required: false })
  @IsOptional()
  @IsNumber({}, { message: '操作工ID必须是数字' })
  userId?: number

  @ApiProperty({ type: String, description: '任务状态', required: false })
  @IsOptional()
  @IsString({ message: '任务状态必须是字符串' })
  status?: string

  @ApiProperty({ type: Boolean, description: '是否委外', required: false })
  @IsOptional()
  @IsBoolean({ message: '是否委外必须是布尔值' })
  isOutsource?: boolean

  @ApiProperty({ type: Boolean, description: '是否进行质检', required: false })
  @IsOptional()
  @IsBoolean({ message: '是否进行质检必须是布尔值' })
  isInspection?: boolean

  @ApiProperty({ type: String, description: '开始时间', required: false })
  @IsOptional()
  @IsString({ message: '开始时间必须是字符串' })
  startTime?: string

  @ApiProperty({ type: String, description: '结束时间', required: false })
  @IsOptional()
  @IsString({ message: '结束时间必须是字符串' })
  endTime?: string
}

export class FindProcessLocatePaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: String, description: '任务状态', required: false })
  @IsOptional()
  @IsString({ message: '任务状态必须是字符串' })
  status?: string
}

export class BatchOperationDto {
  @ApiProperty({ type: [Number], description: '工位任务单ID数组', required: true })
  @IsNotEmpty({ message: '工位任务单ID数组不能为空' })
  ids: number[]
}

export class StartWorkDto {
  @ApiProperty({ description: '工位任务单ID数组', type: [Number] })
  @IsNotEmpty({ message: '工位任务单ID数组不能为空' })
  @IsArray({ message: '工位任务单ID必须是数组' })
  @IsNumber({}, { each: true, message: '工位任务单ID必须是数字' })
  ids: number[]

  @ApiProperty({ description: '操作工ID', required: false })
  @IsOptional()
  @IsNumber({}, { message: '操作工ID必须是数字' })
  userId?: number
}

export class FindByTeamDto {
  @ApiProperty({ type: Number, description: '班组ID', required: true })
  @IsNotEmpty({ message: '班组ID不能为空' })
  teamId: number

  @ApiProperty({ type: String, description: '工单状态', required: false })
  @IsOptional()
  @IsString({ message: '工单状态必须是字符串' })
  orderStatus?: string

  @ApiProperty({ type: String, description: '工序任务状态', required: false })
  @IsOptional()
  @IsString({ message: '工序任务状态必须是字符串' })
  processTaskStatus?: string

  @ApiProperty({ type: String, description: '工位任务状态', required: false })
  @IsOptional()
  @IsString({ message: '工位任务状态必须是字符串' })
  positionTaskStatus?: string
}

export class ProcessLocateDetailDto {
  @ApiProperty({ type: Number, description: '指定人员ID', required: true })
  @IsNotEmpty({ message: '指定人员ID不能为空' })
  userId: number

  @ApiProperty({ type: [Number], description: '工位任务单ID', required: true })
  @IsArray({ message: '工位任务单列表必须是数组' })
  @IsNotEmpty({ message: '工位任务单列表不能为空' })
  processPositionTaskIds: number[]

  @ApiProperty({ type: Number, description: '工序Id', required: true })
  processId: number

  @ApiProperty({ type: String, description: '备注', required: false })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  remark?: string
}

export class CreateProcessLocateDto {
  @ApiProperty({ type: [ProcessLocateDetailDto], description: '派工详情列表', required: true })
  @IsNotEmpty({ message: '派工详情列表不能为空' })
  @IsArray({ message: '派工详情列表必须是数组' })
  details: ProcessLocateDetailDto[]

  @ApiProperty({ type: Number, description: '物料Id', required: true })
  @IsNotEmpty({ message: '物料Id不能为空' })
  materialId: number

  @ApiProperty({ type: Number, description: '生产工单ID', required: false })
  @IsOptional()
  productionOrderTaskId: number

  @ApiProperty({ type: String, description: '备注', required: false })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  remark?: string
}

export class FindByOrderDto {
  @ApiProperty({ type: Number, description: '生产工单ID', required: true })
  @IsNotEmpty({ message: '生产工单ID不能为空' })
  productionOrderTaskId: number

  @ApiProperty({ type: Number, description: '工序ID', required: true })
  processId: number

  @ApiProperty({ type: Number, description: '工序状态筛选', required: false })
  @IsOptional()
  @IsNumber({}, { message: '工序状态必须是数字' })
  processStatus?: number

  @ApiProperty({ type: Number, description: '工位任务状态筛选', required: false })
  @IsOptional()
  @IsNumber({}, { message: '工位任务状态必须是数字' })
  positionStatus?: number
}

export class AuditProcessLocateDto {
  @ApiProperty({ type: String, description: '审核状态', enum: AuditStatus, required: true })
  @IsNotEmpty({ message: '审核状态不能为空' })
  @IsString({ message: '审核状态必须是字符串' })
  status: AuditStatus

  @ApiProperty({ type: String, description: '审核备注', required: false })
  @IsOptional()
  @IsString({ message: '审核备注必须是字符串' })
  auditRemark?: string
}

export class BatchAuditProcessLocateDto {
  @ApiProperty({ type: [Number], description: '派工单ID数组', required: true })
  @IsNotEmpty({ message: '派工单ID数组不能为空' })
  @IsArray({ message: '派工单ID必须是数组' })
  @IsNumber({}, { each: true, message: '派工单ID必须是数字' })
  ids: number[]

  @ApiProperty({ type: AuditProcessLocateDto, description: '审核信息', required: true })
  @IsNotEmpty({ message: '审核信息不能为空' })
  audit: AuditProcessLocateDto
}
