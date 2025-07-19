import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { User } from '@model/auth/user.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ name: 'default', type: String, required: false, description: 'default' })
  default?: string

  @ApiProperty({
    name: 'userCode',
    required: false,
    description: '工号，必填项',
    type: String,
  })
  userCode: string

  @ApiProperty({
    name: 'phone',
    required: false,
    description: '手机号，必填项',
    type: String,
  })
  phone: string

  @ApiProperty({
    name: 'userName',
    required: false,
    description: '员工姓名，必填项',
    type: String,
  })
  userName: string

  @ApiProperty({
    name: 'email',
    required: false,
    description: '邮箱，可选项',
    type: String,
  })
  email?: string

  @ApiProperty({
    name: 'departmentId',
    required: false,
    description: '默认部门ID，外键，可选项',
    type: Number,
  })
  departmentId?: number

  @ApiProperty({
    name: 'roleId',
    required: false,
    description: '角色ID，外键，可选项',
    type: Number,
  })
  roleId?: number

  @ApiProperty({
    name: 'status',
    required: false,
    description: '状态，是否启用，默认为启用',
    type: Boolean,
  })
  status: boolean

  @ApiProperty({
    name: 'factoryId',
    required: false,
    description: '工厂Id，外键，可选项',
    type: Number,
  })
  factoryId?: number
}

export class CUserDto {
  @ApiProperty({
    name: 'userCode',
    required: true,
    description: '工号，必填项',
    type: String,
  })
  userCode: string

  @ApiProperty({
    name: 'phone',
    required: true,
    description: '手机号，必填项',
    type: String,
  })
  phone: string

  @ApiProperty({
    name: 'userName',
    required: true,
    description: '员工姓名，必填项',
    type: String,
  })
  userName: string

  @ApiProperty({
    name: 'email',
    required: false,
    description: '邮箱，可选项',
    type: String,
  })
  email?: string

  @ApiProperty({
    required: false,
    description: '岗位',
    type: String,
  })
  station?: string

  @ApiProperty({
    name: 'departmentId',
    required: false,
    description: '默认部门ID，外键，可选项',
    type: Number,
  })
  departmentId?: number

  @ApiProperty({
    name: 'roleId',
    required: false,
    description: '角色ID，外键，可选项',
    type: Number,
  })
  roleId?: number

  @ApiProperty({
    name: 'status',
    required: true,
    description: '状态，是否启用，默认为启用',
    type: Boolean,
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

export class UUserDto {
  @ApiProperty({
    name: 'userCode',
    required: true,
    description: '工号，必填项',
    type: String,
  })
  userCode: string

  @ApiProperty({
    name: 'phone',
    required: true,
    description: '手机号，必填项',
    type: String,
  })
  phone: string

  @ApiProperty({
    name: 'userName',
    required: true,
    description: '员工姓名，必填项',
    type: String,
  })
  userName: string

  @ApiProperty({
    name: 'email',
    required: false,
    description: '邮箱，可选项',
    type: String,
  })
  email?: string

  @ApiProperty({
    required: false,
    description: '岗位',
    type: String,
  })
  station?: string

  @ApiProperty({
    name: 'departmentId',
    required: false,
    description: '默认部门ID，外键，可选项',
    type: Number,
  })
  departmentId?: number

  @ApiProperty({
    name: 'roleId',
    required: false,
    description: '角色ID，外键，可选项',
    type: Number,
  })
  roleId?: number

  @ApiProperty({
    name: 'status',
    required: true,
    description: '状态，是否启用，默认为启用',
    type: Boolean,
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

export class SUserDto {
  @ApiProperty({
    name: 'phone',
    required: true,
    description: '手机号，必填项',
    type: String,
  })
  phone: string

  @ApiProperty({
    name: 'openId',
    required: true,
    description: 'openId，必填项',
    type: String,
  })
  openId: string
}
