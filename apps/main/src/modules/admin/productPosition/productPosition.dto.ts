import { ApiProperty } from '@nestjs/swagger'
import { TEAM_TYPE } from '@common/enum'
import { IsEnum, IsOptional } from 'class-validator'

export class CreateProductPositionDto {
  //工位名称
  @ApiProperty({
    description: '工位名称',
    type: String,
    required: true,
  })
  name: string
  //子工序ID
  @ApiProperty({
    description: '子工序ID',
    type: Number,
    required: true,
  })
  processId: number

  //班组ID
  @ApiProperty({
    description: '班组ID',
    type: Number,
    required: true,
  })
  teamId: number

  @ApiProperty({
    description: '班组成员ID数组',
    type: [Number],
    required: true,
  })
  userIds: number[]

  @ApiProperty({
    description: '状态',
    type: Boolean,
    required: false,
    default: true,
  })
  status: boolean
}

export class UpdateProductPositionDto {
  //工位名称
  @ApiProperty({
    description: '工位名称',
    type: String,
    required: false,
  })
  name: string
  //子工序ID
  @ApiProperty({
    description: '子工序ID',
    type: Number,
    required: false,
  })
  processId: number

  //班组ID
  @ApiProperty({
    description: '班组ID',
    type: Number,
    required: false,
  })
  teamId: number

  @ApiProperty({
    description: '班组成员ID数组',
    type: [Number],
    required: false,
  })
  userIds: number[]

  @ApiProperty({
    description: '状态',
    type: Boolean,
    default: false,
    required: false,
  })
  status: boolean
}

export class FindPaginationDto {
  //工位名称
  @ApiProperty({
    description: '工位名称',
    type: String,
    required: false,
  })
  name: string
  //子工序ID
  @ApiProperty({
    description: '子工序ID',
    type: Number,
    required: false,
  })
  processId: number

  //班组ID
  @ApiProperty({
    description: '班组ID',
    type: Number,
    required: false,
  })
  teamId: number
}
