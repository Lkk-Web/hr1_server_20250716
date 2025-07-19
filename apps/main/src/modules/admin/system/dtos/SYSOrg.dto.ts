import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Organize } from '@model/auth/organize'

export class FindAllDto {
  @ApiProperty({
    description: '组织名称',
    type: String,
    required: false,
  })
  name: string

  // @ApiProperty({
  //   description: '组织简称',
  //   type: String,
  //   required: false,
  // })
  // shortName: string;

  @ApiProperty({
    description: '组织编码',
    type: String,
    required: false,
  })
  code: string

  @ApiProperty({
    description: '地址',
    type: String,
    required: false,
  })
  address: string

  @ApiProperty({ description: '组织类型（公司、部门）', type: String, required: false })
  types: string

  @ApiProperty({ description: '状态（0禁用 1启用 ）', type: Number, required: false })
  status: number
}

export class CSYSOrgDto {
  @ApiProperty({
    description: '组织名称',
    type: String,
  })
  name: string

  // @ApiProperty({
  //   description: '组织简称',
  //   type: String,
  // })
  // shortName: string;

  @ApiProperty({
    description: '组织编码',
    type: String,
  })
  code: string

  // @ApiProperty({
  //   description: '地址',
  //   type: String,
  // })
  // address: string;

  // @ApiProperty({
  //   description: '经纬度',
  //   type: [Object],
  // })
  // coordinate: any;

  @ApiProperty({ description: '父级id', type: Number, required: false })
  parentId: number

  @ApiProperty({ description: '组织类型（公司、部门）', type: String, required: true })
  types: string

  @ApiProperty({ description: '状态（0禁用 1启用 ）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '排序', type: Number, required: false })
  sort: number

  @ApiProperty({ description: '用户ID数组', type: [Number], required: false })
  users?: number[]

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
  })
  remark: string
}

export class ESYSOrgDto {
  @ApiProperty({
    description: '组织名称',
    type: String,
  })
  name: string

  @ApiProperty({
    description: '组织简称',
    type: String,
  })
  shortName: string

  @ApiProperty({
    description: '组织编码',
    type: String,
  })
  code: string

  // @ApiProperty({
  //   description: '地址',
  //   type: String,
  // })
  // address: string;

  // @ApiProperty({
  //   description: '经纬度',
  //   type: [Object],
  // })
  // coordinate: any;

  @ApiProperty({ description: '父级id', type: Number, required: false })
  parentId: number

  @ApiProperty({ description: '组织类型（公司、部门）', type: String, required: false })
  types: string

  @ApiProperty({ description: '状态（0禁用 1启用 ）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '排序', type: Number, required: false })
  sort: number

  @ApiProperty({ description: '用户ID数组', type: [Number], required: false })
  users?: number[]

  @ApiProperty({
    description: '备注',
    type: String,
    required: false,
  })
  remark: string
}
