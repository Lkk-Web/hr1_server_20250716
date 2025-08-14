import { IsEnum, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ENUM } from 'sequelize'
import { DICT_TYPE } from '@common/enum'

export class CApiDictDto {
  @ApiProperty({ name: 'type', type: String, required: true, description: '字典类型', enum: DICT_TYPE })
  @IsEnum(DICT_TYPE)
  type: DICT_TYPE

  @ApiProperty({ name: 'code', type: String, required: false, description: '字典编码' })
  code?: string

  @ApiProperty({ name: 'content', type: String, required: false, description: '字典内容' })
  content?: string
}

export class UApiDictDto {
  @ApiProperty({ name: 'type', type: String, required: false, description: '字典类型', enum: DICT_TYPE })
  @IsEnum(DICT_TYPE)
  type?: DICT_TYPE

  @ApiProperty({ name: 'code', type: String, required: false, description: '字典编码' })
  code?: string

  @ApiProperty({ name: 'content', type: String, required: false, description: '字典内容' })
  content?: string
}

export class FindPaginationDto extends UApiDictDto {}
