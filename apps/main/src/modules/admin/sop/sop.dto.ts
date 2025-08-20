import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
  @ApiProperty({
    required: false,
    description: '编码/名称',
    type: String,
  })
  text: string
}

export class CSOPDto {
  @ApiProperty({
    required: true,
    description: '工序Id',
    type: Number,
  })
  processId: number

  @ApiProperty({
    required: true,
    description: '状态',
    type: Boolean,
    default: true,
  })
  status: boolean

  @ApiProperty({
    required: false,
    description: '备注',
    type: String,
  })
  remark: string

  @ApiProperty({
    required: false,
    description: '物料Id数组',
    type: [Number],
  })
  ids: number[]

  @ApiProperty({
    required: false,
    description: '文件Id数组',
    type: [Number],
  })
  fileListIds: number[]

  @ApiProperty({
    required: false,
    description: '工艺参数Id数组',
    type: [Number],
  })
  processParametersIds: number[]
}

export class USOPDto {
  @ApiProperty({
    required: true,
    description: '工序Id',
    type: Number,
  })
  processId: number

  @ApiProperty({
    required: true,
    description: '状态',
    type: Boolean,
    default: true,
  })
  status?: boolean

  @ApiProperty({
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string

  @ApiProperty({
    required: false,
    description: '物料Id数组',
    type: [Number],
  })
  ids: number[]

  @ApiProperty({
    required: false,
    description: '文件Id数组',
    type: [Number],
  })
  fileListIds: number[]

  @ApiProperty({
    required: false,
    description: '工艺参数Id数组',
    type: [Number],
  })
  processParametersIds: number[]
}
