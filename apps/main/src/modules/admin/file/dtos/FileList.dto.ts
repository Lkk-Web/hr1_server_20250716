import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { FileList } from '@model/dm/FileList.model'

export class FindPaginationDto {
  @ApiProperty({ type: String, description: '文件名称', required: false })
  name?: string

  @ApiProperty({ type: Number, description: '文件目录ID', required: true })
  fileMenuId?: number

  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class CFileListDto {
  @ApiProperty({ type: String, description: '文件名称', required: false })
  name?: string

  @ApiProperty({ type: Number, description: '文件目录ID', required: true })
  fileMenuId?: number

  @ApiProperty({ type: Number, description: '创建组织', required: false })
  createdOrgId?: number

  @ApiProperty({ type: Number, description: '使用组织', required: false })
  useOrgId?: number

  @ApiProperty({ type: String, description: '文件描述', required: false })
  describe?: string

  @ApiProperty({ type: String, description: '版本描述', required: false })
  versionDescribe?: string

  @ApiProperty({ type: String, description: '文件路径', required: false })
  url?: string

  @ApiProperty({ type: String, description: '文件原始名称', required: false })
  fileName?: string
}

export class EFileListDto {
  @ApiProperty({ type: String, description: '文件名称', required: false })
  name?: string

  @ApiProperty({ type: Number, description: '文件目录ID', required: false })
  fileMenuId?: number

  @ApiProperty({ type: Number, description: '创建组织', required: false })
  createdOrgId?: number

  @ApiProperty({ type: Number, description: '使用组织', required: false })
  useOrgId?: number

  @ApiProperty({ type: String, description: '文件描述', required: false })
  describe?: string
}

export class findDto {
  @ApiProperty({ type: String, description: '文件路径', required: false })
  url?: string
}
