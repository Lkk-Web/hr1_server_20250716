import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { DefectiveItem } from '@model/qm/defectiveItem.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ name: 'default', type: String, required: false, description: 'default' })
  default?: string

  @ApiProperty({
    name: 'code',
    required: false,
    description: '编码，忽略时自动生成',
    type: String,
  })
  code?: string

  // @ApiProperty({
  // 	name: 'category',
  // 	required: false,
  // 	description: '不良品项分类，可选',
  // 	type: String,
  // })
  // category?: string;

  @ApiProperty({
    name: 'name',
    required: true,
    description: '不良品项名称，必填项',
    type: String,
  })
  name: string
}

export class CDefectiveItemDto {
  @ApiProperty({
    name: 'code',
    required: false,
    description: '编码，忽略时自动生成',
    type: String,
  })
  code?: string

  // @ApiProperty({
  // 	name: 'category',
  // 	required: false,
  // 	description: '不良品项分类，可选',
  // 	type: String,
  // })
  // category?: string;

  @ApiProperty({
    name: 'name',
    required: true,
    description: '不良品项名称，必填项',
    type: String,
  })
  name: string

  @ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String })
  formData: string
}

export class UDefectiveItemDto {
  @ApiProperty({
    name: 'code',
    required: false,
    description: '编码，忽略时自动生成',
    type: String,
  })
  code?: string

  // @ApiProperty({
  // 	name: 'category',
  // 	required: false,
  // 	description: '不良品项分类，可选',
  // 	type: String,
  // })
  // category?: string;

  @ApiProperty({
    name: 'name',
    required: false,
    description: '不良品项名称，必填项',
    type: String,
  })
  name: string

  @ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String })
  formData: string
}
