import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UserLoginDto {
  @ApiProperty({ name: 'code', required: true, description: '工号', type: String })
  code: string

  @ApiProperty({ name: 'password', required: true, description: '密码', type: String })
  password: string
}
