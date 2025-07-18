import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    type: String,
    required: false,
    description: '设备名称',
  })
  name: string

  @ApiProperty({
    type: String,
    required: false,
    description: '设备编码',
  })
  code: string

  @ApiProperty({
    type: String,
    required: false,
    description: '报废单号',
  })
  orderCode: string

  @ApiProperty({
    type: Date,
    required: false,
    description: '保养时间',
  })
  maintenanceAt: Date

  @ApiProperty({
    type: String,
    required: false,
    description: '保养员',
  })
  maintenanceUser: string
}

export class maintenanceOrderDetailDto {
  @ApiProperty({
    type: String,
    required: true,
    description: '保养项名称',
  })
  name: string

  @ApiProperty({
    type: String,
    required: true,
    description: '巡检方法',
  })
  method: string

  @ApiProperty({
    description: '保养数值',
    type: Number,
    required: false,
  })
  val: number

  @ApiProperty({
    description: '保养结果',
    type: Boolean,
    required: false,
  })
  bol: boolean

  @ApiProperty({
    type: String,
    required: true,
  })
  type: string
}

export class CMaintenanceOrderDto {
  @ApiProperty({
    type: String,
    required: false,
    description: '保养单号',
  })
  code: string

  @ApiProperty({
    type: Number,
    required: true,
    description: '设备台账Id',
  })
  equipmentLedgerId: number

  @ApiProperty({
    type: Date,
    required: true,
    description: '保养时间',
  })
  maintenanceAt: Date

  @ApiProperty({
    type: Number,
    required: true,
    description: '保养员Id',
  })
  maintenanceUserId: number

  @ApiProperty({
    type: String,
    required: true,
    description: '保养结果',
  })
  result: string

  @ApiProperty({
    type: Date,
    required: true,
    description: '保养时间',
  })
  nextAt: Date

  @ApiProperty({
    type: [maintenanceOrderDetailDto],
    required: false,
    description: '保养单明细数组',
  })
  details: maintenanceOrderDetailDto[]
}

export class UMaintenanceOrderDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: '设备台账Id',
  })
  equipmentLedgerId: number

  @ApiProperty({
    type: Date,
    required: true,
    description: '保养时间',
  })
  maintenanceAt: Date

  @ApiProperty({
    type: Number,
    required: true,
    description: '保养员Id',
  })
  maintenanceUserId: number

  @ApiProperty({
    type: String,
    required: true,
    description: '保养结果',
  })
  result: string

  @ApiProperty({
    type: Date,
    required: true,
    description: '保养时间',
  })
  nextAt: Date

  @ApiProperty({
    type: [maintenanceOrderDetailDto],
    required: false,
    description: '保养单明细数组',
  })
  details: maintenanceOrderDetailDto[]
}
