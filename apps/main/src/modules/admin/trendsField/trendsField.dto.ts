import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationDto } from '@common/dto'
import internal = require('stream')

// 文档中的增加
export class CTrendsFieldDto {
  @ApiProperty({ name: 'name', required: true, description: '字段名称', type: String })
  @IsString({ message: '字段名称不能为空,且必须为字符串' })
  name: string

  @ApiProperty({ name: 'templateId', required: false, description: '字段模版id', type: Number })
  templateId: number

  @ApiProperty({ name: 'types', required: false, description: '字段类型（1单行文本，2多行文本，3单选，4多选，5日期，6图片，7文件）', type: String })
  types: string

  @ApiProperty({ name: 'state', required: false, description: '是否必填（0否，1是）', type: Boolean })
  state: boolean

  @ApiProperty({ name: 'len', required: false, description: '字符长度', type: Number })
  len: number

  @ApiProperty({ name: 'sort', required: false, description: '排序', type: Number })
  sort: number

  @ApiProperty({ name: 'status', required: false, description: '是否是在首页列表中展示（0否，1是）', type: Boolean })
  status: boolean

  @ApiProperty({ name: 'tip', required: false, description: '输入提示', type: String })
  tip: string

  @ApiProperty({ name: 'fieldOption', required: false, description: '选项（单选，多选的选项）', type: String })
  fieldOption: any
}

// 文档中的列表
export class TrendsFieldListDto extends PaginationDto {
  @ApiProperty({ name: 'typesId', required: false, description: '工单类型id', type: String })
  typesId: string

  @ApiProperty({ name: 'userOrAdmin', required: false, description: '用户填写还是管理员填写（0用户，1管理员）', type: String })
  userOrAdmin: string

  @ApiProperty({ name: 'displayState', required: false, description: '显隐状态（0隐藏，1显示）', type: String })
  displayState: string

  @ApiProperty({ name: 'status', required: false, description: '是否是重点字段（0否，1是）', type: String })
  status: string
}

// 文档中的编辑
export class ETrendsFieldDto {
  @ApiProperty({ name: 'name', required: true, description: '字段名称', type: String })
  @IsString({ message: '字段名称不能为空,且必须为字符串' })
  name: string

  @ApiProperty({ name: 'templateId', required: false, description: '字段模版id', type: Number })
  templateId: number

  @ApiProperty({ name: 'typesId', required: true, description: '工单类型id', type: Number })
  @IsString({ message: '字段名称不能为空,且必须为字符串' })
  typesId: number

  @ApiProperty({ name: 'types', required: false, description: '字段类型（1单行文本，2多行文本，3单选，4多选，5日期，6图片，7文件）', type: String })
  types: string

  @ApiProperty({ name: 'state', required: false, description: '是否必填（0否，1是）', type: Boolean })
  state: boolean

  @ApiProperty({ name: 'len', required: false, description: '字符长度', type: Number })
  len: number

  @ApiProperty({ name: 'sort', required: false, description: '排序', type: Number })
  sort: number

  @ApiProperty({ name: 'status', required: false, description: '是否是在首页列表中展示（0否，1是）', type: Boolean })
  status: boolean

  @ApiProperty({ name: 'valueData', required: false, description: '用户填写的内容', type: String })
  valueData: string
}
