import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { TeamType } from '@model/schedule/teamType.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    description: '类型名称',
    type: String,
    required: false,
    example: '',
  })
  name: string

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  status: boolean
}

export class CTeamTypeDto {
  @ApiProperty({
    description: '类型名称',
    type: String,
    required: true,
    example: '',
  })
  name: string

  @ApiProperty({
    type: Boolean,
    required: true,
  })
  status: boolean

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string
}

export class UTeamTypeDto {
  @ApiProperty({
    description: '类型名称',
    type: String,
    required: true,
    example: '',
  })
  name: string

  @ApiProperty({
    type: Boolean,
    required: true,
  })
  status: boolean

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string
}
