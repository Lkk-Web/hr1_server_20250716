import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { FileMenu } from '@model/document/FileMenu.model'

export class FindPaginationDto {
  @ApiProperty({ description: '目录名称', type: String, required: false })
  name: string

  @ApiProperty({ description: '父级id', type: Number, required: false })
  parentId: number

  @ApiProperty({ description: '状态 0/1（0显示 1隐藏）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '类型：0其它 1、ESOP', type: Number, required: false })
  types: number

  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class CFileMenuDto {
  @ApiProperty({ type: String, description: '目录名称', required: false })
  name?: string

  @ApiProperty({ description: '父级id', type: Number, required: false })
  parentId: number

  @ApiProperty({ description: '状态 0/1（0显示 1隐藏）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '类型：0其它 1、ESOP', type: Number, required: false })
  types: number

  @ApiProperty({ description: '排序', type: Number, required: false })
  sort: number
}

export class EFileMenuDto {
  @ApiProperty({ type: String, description: '目录名称', required: false })
  name?: string

  @ApiProperty({ description: '父级id', type: Number, required: false })
  parentId: number

  @ApiProperty({ description: '类型：0其它 1、ESOP', type: Number, required: false })
  types: number

  @ApiProperty({ description: '状态 0/1（0显示 1隐藏）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '排序', type: Number, required: false })
  sort: number
}
