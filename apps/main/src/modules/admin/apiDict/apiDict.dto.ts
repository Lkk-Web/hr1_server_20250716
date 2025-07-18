import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class GetByK3Dto {
  @ApiProperty({ name: 'xtName', type: String, required: true, description: '对接系统' })
  xtName?: string
  @ApiProperty({ name: 'name', type: String, required: false, description: '字典名称' })
  name?: string
  @ApiProperty({ name: 'FormId', required: true, description: '单据id', type: String })
  FormId: string
  @ApiProperty({ name: 'FieldKeys', required: true, description: '查询字段，必须是："ID,编号,内容"，示例："FUNITID,FNumber,FName,FName,FName"，必填', type: String, default: 'FCATEGORYID,FNumber,FName' })
  FieldKeys: string
}

export class CApiDictDto {
  @ApiProperty({ name: 'xtName', type: String, required: true, description: '对接系统' })
  xtName?: string
  @ApiProperty({ name: 'name', type: String, required: false, description: '字典名称' })
  name?: string
  @ApiProperty({ name: 'fid', type: String, required: false, description: '对应id' })
  fid?: string
  @ApiProperty({ name: 'code', type: String, required: false, description: '对应编码' })
  code?: string
  @ApiProperty({ name: 'content', type: String, required: false, description: '对应内容' })
  content?: string
}

export class UApiDictDto {
  @ApiProperty({ name: 'xtName', type: String, required: true, description: '对接系统' })
  xtName?: string
  @ApiProperty({ name: 'name', type: String, required: false, description: '字典名称' })
  name?: string
  @ApiProperty({ name: 'fid', type: String, required: false, description: '对应id' })
  fid?: string
  @ApiProperty({ name: 'code', type: String, required: false, description: '对应编码' })
  code?: string
  @ApiProperty({ name: 'content', type: String, required: false, description: '对应内容' })
  content?: string
}
