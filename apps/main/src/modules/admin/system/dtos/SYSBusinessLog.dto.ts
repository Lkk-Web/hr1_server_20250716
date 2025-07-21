import { IsInt, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { SystemBusinessLog } from '@model/system/operationLog'

export class FindPaginationDto {
  @ApiProperty({ name: 'module', type: String, required: false, description: '操作模块' })
  module?: string
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class CSYSBusinessLogDto {
  @ApiProperty({ description: '操作描述', required: false })
  @IsString()
  description: string

  @ApiProperty({ description: '操作模块', required: false })
  @IsString()
  module: string

  @ApiProperty({ description: '组织code', required: false })
  @IsString()
  orgCode: string

  @ApiProperty({ description: '用户id', required: false })
  @IsInt()
  userId: number

  @ApiProperty({ description: '参数', required: false })
  @IsString()
  params: string
}
