import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { FileVersion } from '@model/document/FileVersion.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({ type: Number, description: '文件ID', required: true })
  fileListId?: number
}

export class CFileVersionDto {
  @ApiProperty({ type: Number, description: '文件ID', required: false })
  fileListId?: number
  @ApiProperty({ type: String, description: '版本描述', required: false })
  describe?: string

  @ApiProperty({ type: String, description: '文件名称', required: false })
  name?: string

  @ApiProperty({ type: String, description: '文件路径', required: false })
  url?: string
}

export class EFileVersionDto {
  @ApiProperty({ type: Number, description: '文件ID', required: false })
  fileListId?: number
  @ApiProperty({ type: String, description: '版本描述', required: false })
  describe?: string
  @ApiProperty({ type: String, description: '文件名称', required: false })
  name?: string
  @ApiProperty({ type: String, description: '文件路径', required: false })
  url?: string
}
