import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class PadLoginDto {
  @ApiProperty({ name: 'processId', required: true, description: '工序id', type: String })
  processId: string

  @ApiProperty({ name: 'orgId', required: true, description: '部门id', type: String })
  orgId: string
}

export class TeamLoginDto {
  @ApiProperty({ name: 'processId', required: true, description: '工序id', type: Number })
  @IsNotEmpty({message:'工序id不能为空'})
  processId: string

  @ApiProperty({ required: true, description: '班组id', type: Number })
  @IsNotEmpty({message:'班组id不能为空'})
  teamId: number
}

export class UserPasswordLoginDto extends TeamLoginDto{

  @ApiProperty({ required: true, description: '工号', type: String })
  @IsNotEmpty({message:'工号不能为空'})
  userCode: string

  @ApiProperty({ required: true, description: '密码', type: String })
  @IsNotEmpty({message:'密码不能为空'})
  password: string

}

export class PadTeamListDto {

  @ApiProperty({ required: false, description: '员工工号', type: String })
  userCode: string
}

export class ProcessDto {
  @ApiProperty({ name: 'orgId', required: false, description: '部门id', type: String })
  orgId: string
  @ApiProperty({ required: false, description: '班组id', type: String })
  teamId: string
}

export class OrgDto {
  @ApiProperty({ name: 'processId', required: false, description: '工序id', type: String })
  processId: string
}
