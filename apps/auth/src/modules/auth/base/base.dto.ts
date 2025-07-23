import { IsJSON, IsNotEmpty, IsString, ValidateIf, IsEnum, IsOptional, MinLength, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PLATFORM, request_Method } from '@common/enum'

export class UserLoginDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @ApiProperty({ name: 'userName', required: true, description: '用户名(手机号)', type: String })
  userName: string

  @ApiProperty({ name: 'password', required: true, description: '密码', type: String })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @ApiProperty({ name: 'platform', required: true, description: '登录平台', enum: PLATFORM })
  @IsNotEmpty({ message: '平台类型不能为空' })
  @IsEnum(PLATFORM, { message: '无效的平台类型' })
  platform: PLATFORM
}

export class TokenGetUserDto {
  @ApiProperty({ description: 'token' })
  @IsNotEmpty()
  @IsString()
  token: string
}

export class MicroserviceTokenVerifyDto {
  @ApiProperty({ description: 'JWT Token' })
  @IsNotEmpty({ message: 'token不能为空' })
  @IsString()
  token: string

  @ApiProperty({ name: 'serviceId', required: false, description: '微服务标识', type: String })
  @IsOptional()
  serviceId?: string

  @ApiProperty({ name: 'path', required: false, description: '请求路径', type: String })
  @IsOptional()
  path?: string

  @ApiProperty({ name: 'method', required: false, description: '请求方法', type: String })
  @IsOptional()
  method?: request_Method

  @ApiProperty({ name: 'body', required: false, description: '请求体', type: String })
  @IsOptional()
  body?: string

  @ApiProperty({ name: 'params', required: false, description: '路由参数', type: String })
  @IsOptional()
  params?: string

  @ApiProperty({ name: 'query', required: false, description: '查询参数', type: String })
  @IsOptional()
  query?: string

  @ApiProperty({ name: 'ip', required: false, description: 'IP地址', type: String })
  @IsOptional()
  ip?: string
}

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新Token' })
  @IsNotEmpty({ message: '刷新token不能为空' })
  @IsString()
  refreshToken: string

  @ApiProperty({ name: 'platform', required: true, description: '平台类型', enum: PLATFORM })
  @IsNotEmpty({ message: '平台类型不能为空' })
  @IsEnum(PLATFORM, { message: '无效的平台类型' })
  platform: PLATFORM
}

export class LogoutDto {
  @ApiProperty({ description: 'JWT Token' })
  @IsNotEmpty({ message: 'token不能为空' })
  @IsString()
  token: string

  @ApiProperty({ name: 'platform', required: true, description: '平台类型', enum: PLATFORM })
  @IsNotEmpty({ message: '平台类型不能为空' })
  @IsEnum(PLATFORM, { message: '无效的平台类型' })
  platform: PLATFORM

  @ApiProperty({ name: 'logoutAll', required: false, description: '是否登出所有设备', type: Boolean })
  @IsOptional()
  logoutAll?: boolean

  @ApiProperty({ description: '设备标识', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string
}

export class UserRegisterDto {
  @ApiProperty({ description: '姓名', required: true })
  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString({ message: '姓名必须是字符串' })
  userName: string

  @ApiProperty({ name: 'userCode', required: true, description: '工号', type: String })
  @IsNotEmpty({ message: '工号不能为空' })
  userCode: string

  @ApiProperty({ description: '手机号', required: true })
  @IsNotEmpty({ message: '手机号不能为空' })
  // @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string

  @ApiProperty({ description: '密码', required: true })
  @IsNotEmpty({ message: '密码不能为空' })
  // @MinLength(6, { message: '密码长度不能少于6位' })
  // @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
  //   message: '密码必须包含至少一个字母和一个数字'
  // })
  password: string
}
