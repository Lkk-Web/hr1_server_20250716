import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { WorkShop } from '@model/base/workShop.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({
    description: '车间名称',
    type: String,
    required: false,
    example: '车间A',
  })
  name: string

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: false,
    example: true,
  })
  status: boolean
}

export class CWorkShopDto {
  @ApiProperty({
    description: '车间名称',
    type: String,
    required: true,
    example: '车间A',
  })
  name: string

  @ApiProperty({
    description: '负责人 ID',
    type: Number,
    required: true,
    example: 1,
  })
  chargeId: number

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

export class UWorkShopDto {
  @ApiProperty({
    description: '车间名称',
    type: String,
    required: true,
    example: '车间A',
  })
  name: string

  @ApiProperty({
    description: '负责人 ID',
    type: Number,
    required: true,
    example: 1,
  })
  chargeId: number

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
