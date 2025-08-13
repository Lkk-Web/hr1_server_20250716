import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ProcessRoute } from '@model/process/processRoute.model'
import { ProcessRouteList } from '@model/process/processRouteList.model'
import { ProcessRouteListItem } from '@model/process/processRouteListItem.model'
import { Column, DataType } from 'sequelize-typescript'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ type: Boolean, required: false, description: 'status' })
  status?: boolean

  @ApiProperty({ type: String, required: false, description: 'name' })
  name?: string

  @ApiProperty({ type: String, required: false, description: '产品名称' })
  materialName?: string

  @ApiProperty({ type: Number, required: false, description: '产品ID' })
  materialId?: number
}

// export class processListItemDto{
// 	// @ApiProperty({
// 	// 	required: false,
// 	// 	description: '关联工序列表Id',
// 	// 	type: Number,
// 	// })
// 	// processRouteListId: number;
//
// 	@ApiProperty({
// 		required: false,
// 		description: '关联不良品项Id',
// 		type: Number,
// 	})
//   defectiveItemId: number;
// }

export class processListDto {
  @ApiProperty({
    name: 'processId',
    required: false,
    description: '工序Id',
    type: Number,
  })
  processId: number

  @ApiProperty({
    name: 'reportRatio',
    required: false,
    description: '报工数比例',
    type: Number,
    example: 1.0,
  })
  reportRatio: number

  @ApiProperty({
    name: 'isReport',
    required: false,
    description: '是否报工',
    type: Boolean,
  })
  isReport: boolean

  @ApiProperty({
    name: 'isOutsource',
    required: false,
    description: '是否委外',
    type: Boolean,
  })
  isOutsource: boolean

  @ApiProperty({ required: false, description: 'fileId', type: Number })
  fileId: number

  @ApiProperty({
    name: 'sort',
    required: false,
    description: '排序',
    type: Number,
  })
  sort: number

  @ApiProperty({
    required: false,
    description: '不良品项列表',
    type: [Number],
  })
  items: number[]

  @Column({
    comment: '是否进行质检',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  isInspection: boolean
}

export class CProcessRouteDto {
  @ApiProperty({
    name: 'name',
    required: true,
    description: '工艺路线名称',
    type: String,
  })
  name: string

  @ApiProperty({
    name: 'materialId',
    required: false,
    description: '关联产品（物料ID）',
    type: Number,
  })
  materialId?: number

  @ApiProperty({
    name: 'groupId',
    required: false,
    description: 'Bom分组id',
    type: String,
  })
  groupId?: string

  @ApiProperty({
    name: 'groupName',
    required: false,
    description: 'Bom分组名称',
    type: String,
  })
  groupName?: string

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注，可选项',
    type: String,
  })
  remark?: string

  @ApiProperty({
    name: 'status',
    required: true,
    description: '状态（启用/禁用）',
    type: Boolean,
  })
  status: boolean

  @ApiProperty({
    required: false,
    description: '工序列表',
    type: [processListDto],
  })
  processRouteList: ProcessRouteList[]
}

export class UProcessRouteDto {
  @ApiProperty({
    name: 'name',
    required: true,
    description: '工艺路线名称',
    type: String,
  })
  name: string

  @ApiProperty({
    name: 'materialId',
    required: true,
    description: '关联产品（物料ID）',
    type: Number,
  })
  materialId: number

  @ApiProperty({
    name: 'groupId',
    required: false,
    description: 'Bom分组id',
    type: String,
  })
  groupId?: string

  @ApiProperty({
    name: 'groupName',
    required: false,
    description: 'Bom分组名称',
    type: String,
  })
  groupName?: string

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注，可选项',
    type: String,
  })
  remark?: string

  @ApiProperty({
    name: 'status',
    required: true,
    description: '状态（启用/禁用）',
    type: Boolean,
  })
  status: boolean

  @ApiProperty({
    required: false,
    description: '工序列表',
    type: [processListDto],
  })
  processRouteList: ProcessRouteList[]
}
