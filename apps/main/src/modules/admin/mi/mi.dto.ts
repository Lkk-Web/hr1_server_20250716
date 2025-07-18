import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UserLoginDto {
  @ApiProperty({ name: 'userName', required: true, description: '姓名', type: String })
  userName: string

  @ApiProperty({ name: 'password', required: true, description: '密码', type: String })
  password: string
}

export class RegisterDto {
  @ApiProperty({ name: 'phone', required: true, description: '手机号 【不能重复】', type: String })
  @IsString({ message: '手机号不能为空,且必须为字符串' })
  phone: string

  @ApiProperty({ name: 'password', required: true, description: '密码', type: String })
  @IsString({ message: '密码不能为空,且必须为字符串' })
  password: string

  @ApiProperty({ name: 'userCode', required: true, description: '工号', type: String })
  userCode: string
}

export class RoleBoardDto {
  @ApiProperty({
    type: String,
    required: false,
    description: '时间类型(本月,本周)',
  })
  timeType: string

  @ApiProperty({ name: 'current', type: Number, required: false, description: 'current' })
  current?: number
  @ApiProperty({ name: 'pageSize', type: Number, required: false, description: 'pageSize' })
  pageSize?: number
}

export class taskProgressDto {
  @ApiProperty({
    type: String,
    required: false,
    description: '时间类型(本月,本周)',
  })
  timeType: string

  @ApiProperty({
    type: Number,
    required: false,
  })
  processId: number

  @ApiProperty({ name: 'current', type: Number, required: false, description: 'current' })
  current?: number
  @ApiProperty({ name: 'pageSize', type: Number, required: false, description: 'pageSize' })
  pageSize?: number
}

export class OrderProgressDto {
  @ApiProperty({
    type: String,
    required: true,
    description: '时间类型(本月,本周)',
  })
  timeType: string

  @ApiProperty({ name: 'current', type: Number, required: false, description: 'current' })
  current?: number
  @ApiProperty({ name: 'pageSize', type: Number, required: false, description: 'pageSize' })
  pageSize?: number
}

export class changeFactoryDto {
  @ApiProperty({ name: 'factoryId', required: true, description: 'factoryId', type: Number })
  factoryId: number
}

export class PCHomeDto {
  @ApiProperty({ name: 'type', required: true, description: '类型(7,30)', type: String })
  type: string
}

export class loginDto {
  @ApiProperty({ name: 'code', required: true, description: '用户code', type: String })
  code: string

  @ApiProperty({ name: 'scene', required: true, description: 'scene', type: Number })
  scene: number
}

export class confirmLoginDto {
  @ApiProperty({ name: 'userId', required: true, description: 'userId', type: Number })
  userId: number

  @ApiProperty({ name: 'factoryId', required: true, description: 'factoryId', type: Number })
  factoryId: number
}

export class UserRegisterDto {
  @ApiProperty({ name: 'text', required: true, description: '加密文本', type: String })
  text: string

  @ApiProperty({ name: 'appKey', required: true, description: '时间戳', type: String })
  appKey: string
}

export class SmsDto {
  @ApiProperty({ name: 'phone', required: true, description: '手机号', type: String })
  @IsString({ message: '手机号不能为空,且必须为字符串' })
  phone: string

  @ApiProperty({ name: 'types', required: true, description: '类型（0注册，1其他）', type: String })
  types: string
}

export class MenuJump {
  @ApiProperty({ name: 'url', required: true, description: '请求地址', type: String })
  @IsString({ message: '请求地址不能为空,且必须为字符串' })
  url: string
}
