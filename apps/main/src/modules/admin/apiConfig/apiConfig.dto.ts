import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class CApiConfigDto {
  @ApiProperty({ name: 'name', type: String, required: true, description: '平台名称' })
  name?: string
  @ApiProperty({ name: 'types', type: String, required: true, description: '平台类型(金蝶)' })
  types?: string
  @ApiProperty({ name: 'status', type: Boolean, required: true, description: '状态(启用、禁用)' })
  status?: boolean
  @ApiProperty({ name: 'appId', type: String, required: true, description: 'appId' })
  appId?: string
  @ApiProperty({ name: 'appSecret', type: String, required: true, description: 'appSecret' })
  appSecret?: string
  @ApiProperty({ name: 'acctId', type: String, required: false, description: 'acctId' })
  acctId?: string
  @ApiProperty({ name: 'acctSecret', type: String, required: false, description: 'acctSecret' })
  acctSecret?: string
  @ApiProperty({ name: 'username', type: String, required: false, description: '用户名' })
  username?: string
  @ApiProperty({ name: 'paasword', type: String, required: false, description: '密码' })
  paasword?: string
}

export class UApiConfigDto {
  @ApiProperty({ name: 'name', type: String, required: true, description: '平台名称' })
  name?: string
  @ApiProperty({ name: 'types', type: String, required: true, description: '平台类型(金蝶)' })
  types?: string
  @ApiProperty({ name: 'status', type: Boolean, required: true, description: '状态(启用、禁用)' })
  status?: boolean
  @ApiProperty({ name: 'appId', type: String, required: true, description: 'appId' })
  appId?: string
  @ApiProperty({ name: 'appSecret', type: String, required: true, description: 'appSecret' })
  appSecret?: string
  @ApiProperty({ name: 'acctId', type: String, required: false, description: 'acctId' })
  acctId?: string
  @ApiProperty({ name: 'acctSecret', type: String, required: false, description: 'acctSecret' })
  acctSecret?: string
  @ApiProperty({ name: 'username', type: String, required: false, description: '用户名' })
  username?: string
  @ApiProperty({ name: 'paasword', type: String, required: false, description: '密码' })
  paasword?: string
}
