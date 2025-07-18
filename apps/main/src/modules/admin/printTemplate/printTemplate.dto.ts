import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PrintTemplate } from '@model/sys/printTemplate.model'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class CPrintTemplateDto {
  @ApiProperty({
    required: true,
    description: '模板名称',
    type: String,
  })
  templateName: string

  @ApiProperty({
    required: true,
    description: '模板规格',
    type: String,
  })
  templateSize: string

  @ApiProperty({
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string

  @ApiProperty({
    required: true,
    description: '二维码内容',
    type: String,
  })
  qrCodeContent: string

  @ApiProperty({
    required: false,
    description: '产品编号',
    type: String,
  })
  productCode?: string

  @ApiProperty({
    required: false,
    description: '产品名称',
    type: String,
  })
  productName?: string

  @ApiProperty({
    required: false,
    description: '产品规格',
    type: String,
  })
  productSpec?: string

  @ApiProperty({
    required: false,
    description: '计划数',
    type: Number,
  })
  planCount?: number

  @ApiProperty({
    required: false,
    description: '计划时间',
    type: String,
  })
  planTime?: string

  @ApiProperty({
    required: false,
    description: '备注信息',
    type: String,
  })
  notes?: string
}

export class UPrintTemplateDto {
  @ApiProperty({
    required: true,
    description: '模板名称',
    type: String,
  })
  templateName: string

  @ApiProperty({
    required: true,
    description: '模板规格',
    type: String,
  })
  templateSize: string

  @ApiProperty({
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string

  @ApiProperty({
    required: true,
    description: '二维码内容',
    type: String,
  })
  qrCodeContent: string

  @ApiProperty({
    required: false,
    description: '产品编号',
    type: String,
  })
  productCode?: string

  @ApiProperty({
    required: false,
    description: '产品名称',
    type: String,
  })
  productName?: string

  @ApiProperty({
    required: false,
    description: '产品规格',
    type: String,
  })
  productSpec?: string

  @ApiProperty({
    required: false,
    description: '计划数',
    type: Number,
  })
  planCount?: number

  @ApiProperty({
    required: false,
    description: '计划时间',
    type: String,
  })
  planTime?: string

  @ApiProperty({
    required: false,
    description: '备注信息',
    type: String,
  })
  notes?: string
}
