import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: String, description: '销售订单编码', required: false })
  code: string

  @ApiProperty({ type: String, description: '金蝶编码', required: false })
  kingdeeCode: string

  @ApiProperty({ type: String, description: '状态 (未开始, 执行中, 已暂停, 已取消, 未完成, 已完成)', required: false })
  status: string

  @ApiProperty({ type: String, description: '状态 (未排产, 已排产)', required: false })
  schedulingStatus: string

  @ApiProperty({ type: String, description: '产品名称', required: false })
  name: string

  @ApiProperty({ type: String, description: '产品编码', required: false })
  materialCode: string

  @ApiProperty({ type: Boolean, description: '是否只展示自己部门的', required: false })
  isDept: boolean

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
    description: '工序计划开始时间',
    type: Date,
    required: false,
  })
  popStartTime: Date

  @ApiProperty({
    description: '工序计划结束时间',
    type: Date,
    required: false,
  })
  popEndTime: Date

  @ApiProperty({
    name: 'warehouseId',
    required: false,
    description: '仓库Id',
    type: Number,
  })
  warehouseId: number

  @ApiProperty({
    required: false,
    description: '是否展开关联项',
    type: Number,
  })
  isExp: number
}

export class ERPFindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: String, description: 'ERP编码', required: false })
  code: string
}

export class POBPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: String, description: '金蝶编码', required: false })
  code: string

  @ApiProperty({ type: String, description: '物料编码', required: false })
  materialCode: string

  @ApiProperty({ type: String, description: '物料名称', required: false })
  materialName: string
}

export class priorityDto {
  @ApiProperty({ required: false, description: '优先级', type: String })
  priority: string
}

export class actionDto {
  @ApiProperty({ type: [String], description: '生产订单编号', required: true })
  @IsNotEmpty({ message: '未携带订单编号' })
  kingdeeCodes: string[]

  @ApiProperty({ required: false, description: '类型值(开始,结束,取消,撤回)', type: String })
  type: string
}

export class ProcessDto {
  @ApiProperty({ type: Number, description: '工序ID', required: true })
  processId: number

  @ApiProperty({ type: [Number], description: '部门ID数组', required: false })
  deptsId: number[]

  @ApiProperty({ required: true, description: '报工数比例（支持两位小数）', type: Number, example: 1.0 })
  reportRatio: number

  @ApiProperty({ required: false, description: '是否报工', type: Boolean })
  isReport: boolean

  @ApiProperty({ required: false, description: '是否委外', type: Boolean })
  isOutsource: boolean

  @ApiProperty({ required: false, description: 'fileId', type: Number })
  fileId: number

  @ApiProperty({ required: false, description: '排序', type: Number })
  sort: number

  @ApiProperty({ type: Number, description: '计划数', required: true })
  planCount: number

  @ApiProperty({ type: Number, description: '良品数', required: false })
  goodCount: number

  @ApiProperty({ type: Number, description: '不良品数', required: false })
  badCount: number

  @ApiProperty({ type: Date, description: '计划开始时间', required: true })
  startTime: Date

  @ApiProperty({ type: Date, description: '计划结束时间', required: true })
  endTime: Date

  @ApiProperty({ type: Date, description: '实际开始时间', required: false })
  actualStartTime?: Date

  @ApiProperty({ type: Date, description: '实际结束时间', required: false })
  actualEndTime?: Date

  @ApiProperty({
    required: false,
    description: '不良品项列表',
    type: [Number],
  })
  items: number[]

  @ApiProperty({
    type: Boolean,
    required: false,
    description: '是否进行质检',
  })
  isInspection: boolean
}

export class BomDto {
  @ApiProperty({ type: Number, description: '序号', required: false })
  sort: number

  @ApiProperty({ type: Number, description: 'materialId', required: true })
  materialId: number

  @ApiProperty({ type: Number, description: '数量', required: false })
  quantity?: number

  @ApiProperty({ type: String, description: '单位', required: false })
  unit?: string

  @ApiProperty({ type: Number, description: '投料工序', required: false })
  feedProcessId?: number

  @ApiProperty({ type: String, description: '物料属性', required: false })
  attr?: string

  @ApiProperty({ type: Number, description: '需求数量', required: false })
  needCount?: number

  @ApiProperty({ type: String, description: '备注', required: false })
  remark?: string

  @ApiProperty({ required: false, description: '启动批号管理', type: Boolean })
  batNumber?: boolean
}

export class ProductionOrderTaskDto {
  @ApiProperty({ type: String, description: '生产订单详情ID', required: true })
  @IsNotEmpty({ message: '生产订单详情ID不能为空' })
  productionOrderDetailId: string

  @ApiProperty({ type: Number, description: '拆分数量', required: true })
  @IsNotEmpty({ message: '拆分数量不能为空' })
  splitQuantity: number

  @ApiProperty({ type: String, description: '备注', required: false })
  remark?: string
}

export class CProductionOrderDTO {
  @ApiProperty({ type: String, description: '工单编号', required: false })
  code: string

  @ApiProperty({ type: Number, description: 'bomId', required: true })
  bomId: number

  @ApiProperty({ type: Number, description: 'topMaterialId', required: true })
  topMaterialId: number

  @ApiProperty({ type: Number, description: 'subMaterialId', required: true })
  subMaterialId: number

  @ApiProperty({ type: Number, description: '销售订单Id', required: false })
  salesOrderId: number

  @ApiProperty({ type: String, description: '状态 (未开始, 执行中, 已暂停, 已取消, 已完成)', required: true, default: '未开始' })
  status: string

  @ApiProperty({ type: String, description: '优先级 (加急, 普通, 无)', required: false, default: '普通' })
  priority: string

  @ApiProperty({ type: Number, description: '计划产出 (数量)', required: true })
  plannedOutput: number

  @ApiProperty({ type: Date, description: '计划开始时间', required: true })
  startTime: Date

  @ApiProperty({ type: Date, description: '计划结束时间', required: true })
  endTime: Date

  @ApiProperty({ type: Number, description: '实际产出 (数量)', required: false })
  actualOutput?: number

  @ApiProperty({ type: Date, description: '实际开始时间', required: false })
  actualStartTime?: Date

  @ApiProperty({ type: Date, description: '实际结束时间', required: false })
  actualEndTime?: Date

  @ApiProperty({ type: Number, description: '累计工时', required: false })
  totalWorkingHours?: number

  @ApiProperty({ type: String, description: '当前工序', required: false })
  currentProcess?: string

  @ApiProperty({ required: false, description: '备注', type: String })
  remark?: string

  @ApiProperty({ required: false, description: '备注', type: [ProcessDto] })
  processes?: ProcessDto[]

  @ApiProperty({ required: false, description: '备注', type: [BomDto] })
  boms?: BomDto[]

  @ApiProperty({
    name: 'batNum',
    required: true,
    description: '批次号',
    type: String,
  })
  batNum?: string
}

export class UProductionOrderDTO {
  @ApiProperty({ type: String, description: '工单编号', required: false })
  code: string

  @ApiProperty({ type: Number, description: 'bomId', required: true })
  bomId: number

  @ApiProperty({ type: Number, description: '销售订单Id', required: false })
  salesOrderId: number

  @ApiProperty({ type: String, description: '状态 (未开始, 执行中, 已暂停, 已取消, 已完成)', required: true, default: '未开始' })
  status: string

  @ApiProperty({ type: String, description: '优先级 (加急, 普通, 无)', required: false, default: '普通' })
  priority: string

  @ApiProperty({ type: Number, description: '计划产出 (数量)', required: true })
  plannedOutput: number

  @ApiProperty({ type: Date, description: '计划开始时间', required: true })
  startTime: Date

  @ApiProperty({ type: Date, description: '计划结束时间', required: true })
  endTime: Date

  @ApiProperty({ type: Number, description: '实际产出 (数量)', required: false })
  actualOutput?: number

  @ApiProperty({ type: Date, description: '实际开始时间', required: false })
  actualStartTime?: Date

  @ApiProperty({ type: Date, description: '实际结束时间', required: false })
  actualEndTime?: Date

  @ApiProperty({ type: Number, description: '累计工时', required: false })
  totalWorkingHours?: number

  @ApiProperty({ type: String, description: '当前工序', required: false })
  currentProcess?: string

  @ApiProperty({ required: false, description: '备注', type: String })
  remark?: string

  @ApiProperty({ required: false, description: '备注', type: [ProcessDto] })
  processes?: ProcessDto[]

  @ApiProperty({ required: false, description: '备注', type: [BomDto] })
  boms?: BomDto[]

  @ApiProperty({
    name: 'batNum',
    required: true,
    description: '批次号',
    type: String,
  })
  batNum?: string
}

export class pobDto {
  @ApiProperty({ type: String, description: '金蝶工单编号', required: true })
  kingdeeCode: string
}
