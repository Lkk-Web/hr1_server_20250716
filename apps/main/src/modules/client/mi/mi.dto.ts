import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class PDALoginDto{
  @ApiProperty({ required: true, description: '手机号', type: String, })
  phone: string

  @ApiProperty({ name: 'password', required: false, description: '密码 二选一', type: String, })
  password: string

  @ApiProperty({ required: false, description: '工厂码 加密后的 二选一', type: String, })
  factoryCode: string
}
export class WorkStationLoginDto {
  @ApiProperty({ required: true, description: '手机号', type: String, })
  phone: string

  @ApiProperty({ required: true, description: '密码', type: String, })
  password: string

  @ApiProperty({ required: false, description: '工厂码', type: String, })
  factoryCode: string
}

export class RoleBoardDto{
  @ApiProperty({
    type: String,
    required: true,
    description: '时间类型(本月,本周)',
  })
  timeType: string;
}

export class taskProgressDto{
  @ApiProperty({
    type: String,
    required: true,
    description: '时间类型(本月,本周)',
  })
  timeType: string;

  @ApiProperty({
    type: Number,
    required: true,
  })
  processId: number;

  @ApiProperty({ name: 'current', type: Number, required: false, description: 'current' })
  current?: number;
  @ApiProperty({ name: 'pageSize', type: Number, required: false, description: 'pageSize' })
  pageSize?: number;
}

export class OrderProgressDto{
  @ApiProperty({
    type: String,
    required: true,
    description: '时间类型(本月,本周)',
  })
  timeType: string;

  @ApiProperty({ name: 'current', type: Number, required: false, description: 'current' })
  current?: number;
  @ApiProperty({ name: 'pageSize', type: Number, required: false, description: 'pageSize' })
  pageSize?: number;
}



export class ScheduleFindPaginationDto {
  @ApiProperty({ type: Number, required: false, description: 'orderCurrent' })
  orderCurrent?: number
  @ApiProperty({ type: Number, required: false, description: 'orderPageSize' })
  orderPageSize?: number
}

export class taskBoardDto {
  @ApiProperty({ type: Number, required: false, description: 'taskCurrent' })
  taskCurrent?: number
  @ApiProperty({ type: Number, required: false, description: 'taskPageSize' })
  taskPageSize?: number
}

export class performanceDto {
  @ApiProperty({ type: String, required: false, description: 'self/dept/all' })
  types?: string

  @ApiProperty({ type: String, required: false, description: '已审核/未审核' })
  status?: string

  @ApiProperty({ name: 'current', type: Number, required: false, description: 'current' })
  current?: number
  @ApiProperty({ name: 'pageSize', type: Number, required: false, description: 'pageSize' })
  pageSize?: number
}

export class UserLoginDto {
  @ApiProperty({required: true, description: '工号', type: String })
  @IsString({message:"工号必须是字符串"})
  userCode: string

  @ApiProperty({required: true, description: '密码', type: String })
  @IsString({message:"密码必须是字符串"})
  password: string
}

export class changeFactoryDto {
  @ApiProperty({ name: 'factoryId', required: true, description: 'factoryId', type: Number })
  factoryId: number
}
