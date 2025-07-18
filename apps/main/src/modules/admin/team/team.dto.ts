import { ApiProperty } from '@nestjs/swagger'
import { TEAM_TYPE } from '@common/enum'
import { IsEnum, IsOptional } from 'class-validator'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: Number, required: false, description: '是否为外包工序',enum:[0,1] })
  isOut?: number

  @ApiProperty({required: false, description: '班组类型', type: String,enum:TEAM_TYPE })
  type: TEAM_TYPE

  @ApiProperty({
    description: '班组名称',
    type: String,
    required: false,
    example: '班组A',
  })
  name: string

/*  @ApiProperty({
    description: '班组类型',
    type: String,
    required: false,
    example: '生产班组',
  })
  teamType: string*/

  @ApiProperty({
    description: '负责人',
    type: String,
    required: false,
    example: '张三',
  })
  chargeName: string

  @ApiProperty({
    description: '所属车间',
    type: String,
    required: false,
    example: '车间1',
  })
  workShopName: string
}

export class CTeamDto {
  @ApiProperty({
    description: '班组名称',
    type: String,
    required: true,
    example: '班组A',
  })
  name: string

/*  @ApiProperty({
    description: '班组类型',
    type: Number,
    required: true,
    example: 1,
  })
  teamTypeId: number*/

  @ApiProperty({
    description: '负责人 ID',
    type: Number,
    required: false,
    example: 1,
  })
  chargeId: number

  @ApiProperty({
    description: '工序id',
    type: [Number],
    required: false,
  })
  processIds: number[]

  @ApiProperty({
    description: '部门ID',
    type: Number,
    required: false,
    example: 1,
  })
  departmentId: number

  @ApiProperty({
    description: '所属车间 ID',
    type: Number,
    required: false,
    example: 2,
  })
  workShopId: number

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: false,
    example: true,
  })
  status: boolean

  @ApiProperty({required: true, description: '班组类型', type: String,enum:TEAM_TYPE })
  @IsEnum(TEAM_TYPE,{message:"班组类型错误"})
  type: TEAM_TYPE

  @ApiProperty({ description: '是否为外包工序 默认false', type: Boolean })
  isOut: boolean

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
    example: '这是一个示例备注。',
  })
  remark: string

  @ApiProperty({
    description: '班组成员ID数组',
    type: [Number],
    required: false,
    example: 2,
  })
  userIds: number[]

  @ApiProperty({
    description: '设备台账Id',
    type: [Number],
    required: false,
    // example: '设备台账Id',
  })
  equipmentLedgerIds: number[]
}

export class UTeamDto {
  @ApiProperty({
    description: '班组名称',
    type: String,
    required: true,
    example: '班组A',
  })
  name: string

/*  @ApiProperty({
    description: '班组类型',
    type: Number,
    required: true,
    example: 1,
  })
  teamTypeId: number*/

  @ApiProperty({
    description: '负责人 ID',
    type: Number,
    required: false,
    example: 1,
  })
  chargeId: number

  @ApiProperty({required: false, description: '班组类型', type: String,enum:TEAM_TYPE })
  @IsOptional()
  @IsEnum(TEAM_TYPE,{message:"班组类型错误"})
  type: TEAM_TYPE

  @ApiProperty({ description: '是否为外包工序 默认false', type: Boolean })
  isOut: boolean

  @ApiProperty({
    description: '所属车间 ID',
    type: Number,
    required: false,
    example: 2,
  })
  workShopId: number

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: false,
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

  @ApiProperty({
    description: '班组成员ID数组',
    type: [Number],
    required: false,
    example: 2,
  })
  userIds: number[]

  @ApiProperty({
    description: '工序ID',
    type: Number,
    required: false,
    example: 1,
  })
  processId: number

  @ApiProperty({
    description: '部门ID',
    type: Number,
    required: false,
    example: 1,
  })
  departmentId: number

  @ApiProperty({
    description: '设备台账Id',
    type: [Number],
    required: false,
  })
  equipmentLedgerIds: number[]

  @ApiProperty({
    description: '工序id',
    type: [Number],
    required: false,
  })
  processIds: number[]
}
