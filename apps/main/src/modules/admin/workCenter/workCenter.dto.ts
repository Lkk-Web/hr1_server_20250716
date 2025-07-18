import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, isEmpty, ValidateNested } from 'class-validator'
import { F } from 'lodash/fp'
import { StringDataTypeOptions } from 'sequelize'

export class CreateWorkCenterDto {
  @ApiProperty({
    description: '工作中心名称',
    type: String,
    required: true,
    example: 'XXXX工作区',
  })
  name: string

  @ApiProperty({
    description: '车间ID',
    type: Number,
    required: true,
    example: 1,
  })
  workShopId: number

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: true,
    example: 1,
  })
  processId: number

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: true,
    example: true,
  })
  status: boolean

  @ApiProperty({
    description: '工作中心编码',
    type: String,
    required: true,
    example: 'XXXX001',
  })
  code: string

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
    example: '备注信息',
  })
  remark: string

  @ApiProperty({
    description: '日产能',
    type: Number,
    required: false,
    example: 10000,
  })
  dailyCapacity: number

  @ApiProperty({
    description: '标准人数',
    type: Number,
    required: false,
    example: 10,
  })
  standardCount: number
}

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '工作中心名称',
    type: String,
    required: false,
    example: 'XXXX工作区',
  })
  name: string

  @ApiProperty({
    description: '工作中心编码',
    type: String,
    required: false,
    example: 'XXXX001',
  })
  code: string

  @ApiProperty({
    description: '车间名称',
    type: String,
    required: false,
    example: 'xxx车间',
  })
  workShopName: string

  @ApiProperty({
    description: '工序名称',
    type: String,
    required: false,
    example: '激光切割',
  })
  processName: string
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

  // @ApiProperty({
  //   description: '工作中心名称',
  //   type: String,
  //   required: false,
  //   example: 'XXXX工作区',
  // })
  // name: string
}

export class UpdateWorkCenterDto {
  @ApiProperty({
    description: '工作中心名称',
    type: String,
    required: true,
    example: 'XXXX工作区',
  })
  name: string

  @ApiProperty({
    description: '车间ID',
    type: Number,
    required: true,
    example: 1,
  })
  workShopId: number

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: true,
    example: 2,
  })
  processId: number

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: true,
    example: true,
  })
  status: boolean

  @ApiProperty({
    description: '工作中心编码',
    type: String,
    required: true,
    example: 'XXXX001',
  })
  code: string

  @ApiProperty({
    description: '日产能',
    type: Number,
    required: false,
    example: 10000,
  })
  dailyCapacity: number

  @ApiProperty({
    description: '标准人数',
    type: Number,
    required: false,
    example: 10,
  })
  standardCount: number

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
    example: '备注信息',
  })
  remark: string
}

export class ScheduleList {
  @ApiProperty({ description: '工作中心编辑Id', type: Number, required: false })
  id: number

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
    description: '工作空间Id',
    type: Number,
    required: true,
  })
  WorkCenterId: number

  @ApiProperty({
    description: '工单工序Id',
    type: Number,
    required: true,
  })
  POPId: number
}

export class ScheduleDto {
  @ApiProperty({ description: '排产列表', type: [ScheduleList] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleList)
  ScheduleList: ScheduleList[]

  @ApiProperty({ description: '工单Id', type: String, required: true })
  productionOrderId: string
}
