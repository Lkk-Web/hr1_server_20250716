import { ApiProperty } from '@nestjs/swagger'

export class FindPaginationDto {
  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string
  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({
    required: false,
    description: '工序名称',
    type: String,
  })
  processName: string

  @ApiProperty({
    required: false,
    description: '报工部门',
    type: [Number],
  })
  departmentId: number[]

  @ApiProperty({
    name: 'filterId',
    required: false,
    description: '过滤Id',
    type: [Number],
  })
  filterId?: number[]

  @ApiProperty({ type: Number, required: false, description: '是否为外包工序', enum: [0, 1] })
  isOut?: number
}

export class findMaterialDto {
  @ApiProperty({
    required: false,
    description: '物料编码/物料名称',
    type: String,
  })
  text: string
}

export class CProcessDto {
  @ApiProperty({
    name: 'processName',
    required: true,
    description: '工序名称，必填项',
    type: String,
  })
  processName: string

  @ApiProperty({
    name: 'parentId',
    required: false,
    description: '父级工序ID',
    type: Number,
  })
  parentId?: number

  @ApiProperty({
    name: 'departmentId',
    required: true,
    description: '报工部门ID，必填项',
    type: [Number],
  })
  departmentId: number[]

  @ApiProperty({
    name: 'reportRatio',
    required: true,
    description: '报工数比例（支持两位小数）',
    type: Number,
    example: 1.0,
  })
  reportRatio: number

  @ApiProperty({
    required: false,
    description: '是否为外包工序',
    type: Boolean,
  })
  isOut: boolean

  @ApiProperty({
    name: 'defectiveItems',
    required: false,
    description: '不良品项列表，可选项',
    type: [Number], // 假设传递不良品项ID的数组
  })
  defectiveItems?: number[]
}

export class UProcessDto {
  @ApiProperty({
    name: 'processName',
    required: true,
    description: '工序名称，必填项',
    type: String,
  })
  processName: string

  @ApiProperty({
    name: 'parentId',
    required: false,
    description: '父级工序ID',
    type: Number,
  })
  parentId?: number

  @ApiProperty({
    name: 'departmentId',
    required: true,
    description: '报工部门ID，必填项',
    type: [Number],
  })
  departmentId: number[]

  @ApiProperty({
    name: 'reportRatio',
    required: true,
    description: '报工数比例（支持两位小数）',
    type: Number,
    example: 1.0,
  })
  reportRatio: number

  @ApiProperty({
    name: 'defectiveItems',
    required: false,
    description: '不良品项列表，可选项',
    type: [Number], // 假设传递不良品项ID的数组
  })
  defectiveItems?: number[]

  @ApiProperty({
    required: false,
    description: '是否为外包工序',
    type: Boolean,
  })
  isOut: boolean
}
