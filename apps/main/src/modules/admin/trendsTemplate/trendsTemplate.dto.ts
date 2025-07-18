import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PaginationDto } from '@common/dto'

// 文档中的增加
export class CTrendsTemplateDto {
  @ApiProperty({ name: 'name', required: true, description: '模版名称', type: String })
  @IsString({ message: '模版名称不能为空,且必须为字符串' })
  name: string

  @ApiProperty({ required: false, description: '模版类型', type: String })
  // @IsString({ message: '模版类型不能为空,且必须为字符串' })
  types: string

  @ApiProperty({ name: 'code', required: false, description: '模版code', type: String })
  code: string

  @ApiProperty({ name: 'describe', required: false, description: '动态模版描述', type: String })
  describe: string

  @ApiProperty({ name: 'sort', required: false, description: '动态字段模版排序', type: Number })
  sort: number

  @ApiProperty({ name: 'trendsFieldDatas', required: false, description: '动态字段字段列表（与添加动态字段字段接口中的字段一致）', type: String })
  trendsFieldDatas: any
}

// 文档中的列表
export class TrendsTemplateListDto extends PaginationDto {
  @ApiProperty({ name: 'code', required: false, description: '模版code', type: String })
  code: string
}

// 文档中的编辑
export class ETrendsTemplateDto {
  @ApiProperty({ name: 'name', required: false, description: '模版名称', type: String })
  name: string

  @ApiProperty({ required: false, description: '模版类型', type: String })
  types: string

  @ApiProperty({ name: 'code', required: false, description: '模版code', type: String })
  code: string

  @ApiProperty({ name: 'describe', required: false, description: '动态模版描述', type: String })
  describe: string

  @ApiProperty({ name: 'sort', required: false, description: '动态字段模版排序', type: Number })
  sort: number

  @ApiProperty({ name: 'trendsFieldDatas', required: false, description: '动态字段字段列表（与添加动态字段字段接口中的字段一致）', type: String })
  trendsFieldDatas: any
}
