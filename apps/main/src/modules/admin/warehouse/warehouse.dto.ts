import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Warehouse } from '@model/wm/warehouse.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '仓库Id过滤',
    type: [Number],
    required: false,
  })
  ids: number[]

  @ApiProperty({
    description: '仓库名称',
    type: String,
    required: false,
    example: '仓库A',
  })
  name: string

  @ApiProperty({
    description: '仓库属性',
    type: String,
    required: false,
    example: '普通仓/线边仓',
  })
  type: string

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: false,
    example: true,
  })
  status: boolean
}

export class CWarehouseDto {
  @ApiProperty({
    description: '仓库名称',
    type: String,
    required: true,
    example: '仓库A',
  })
  name: string

  @ApiProperty({
    description: '仓库属性',
    type: String,
    required: true,
    example: '普通仓/线边仓',
  })
  type: string

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: true,
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
}

export class UWarehouseDto {
  @ApiProperty({
    description: '仓库名称',
    type: String,
    required: true,
    example: '仓库A',
  })
  name: string

  @ApiProperty({
    description: '仓库属性',
    type: String,
    required: true,
    example: '普通仓/线边仓',
  })
  type: string

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: true,
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
}
