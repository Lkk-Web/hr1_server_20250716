import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

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
    description: '物料编码，忽略时自动生成',
    type: String,
  })
  code?: string

  @ApiProperty({
    name: 'name',
    required: false,
    description: '物料名称',
    type: String,
  })
  name: string

  @ApiProperty({
    name: 'spec',
    required: false,
    description: '物料规格',
    type: String,
  })
  spec?: string

  @ApiProperty({
    name: 'attribute',
    required: false,
    description: '物料属性，默认为自制',
    type: String,
  })
  attribute: string



  @ApiProperty({
    name: 'unit',
    required: false,
    description: '单位',
    type: String,
  })
  unit?: string



  @ApiProperty({
    name: 'status',
    required: false,
    description: '状态（启用/禁用），默认为启用',
    type: Boolean,
  })
  status: boolean

  @ApiProperty({
    name: 'filterCode',
    required: false,
    description: '过滤code',
    type: [String],
  })
  filterCode?: string[]

  @ApiProperty({
    name: 'hasBom',
    required: false,
    description: '查询是否包含BOM的物料',
    type: Boolean,
  })
  hasBom: boolean

  @ApiProperty({
    required: false,
    description: '仓库Id',
    type: Number,
  })
  warehouseId: number

  @ApiProperty({
    required: false,
    description: '物料类别',
    type: String,
  })
  category: string
}

export class CMaterialDto {

  @ApiProperty({
    name: 'code',
    required: false,
    description: '物料编码，忽略时自动生成',
    type: String,
  })
  code?: string

  @ApiProperty({
    name: 'name',
    required: true,
    description: '物料名称，必填项',
    type: String,
  })
  name: string

  @ApiProperty({
    name: 'spec',
    required: false,
    description: '物料规格',
    type: String,
  })
  spec?: string

  @ApiProperty({
    name: 'attr',
    required: true,
    description: '物料属性，默认为自制',
    type: String,
  })
  attr: string = '自制'

  @ApiProperty({
    required: false,
    description: '物料类别',
    type: String,
  })
  category: string

  @ApiProperty({
    name: 'unit',
    required: false,
    description: '单位',
    type: String,
  })
  unit?: string



  @ApiProperty({
    name: 'status',
    required: true,
    description: '状态（启用/禁用），默认为启用',
    type: Boolean,
  })
  status: boolean = true

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string

  @ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String, })
  formData: string

  @ApiProperty({
    name: 'batNumber',
    required: false,
    description: '启动批号管理',
    type: Boolean,
  })
  batNumber?: boolean
}

export class UMaterialDto {

  @ApiProperty({
    name: 'name',
    required: true,
    description: '物料名称，必填项',
    type: String,
  })
  name: string

  @ApiProperty({
    name: 'spec',
    required: false,
    description: '物料规格',
    type: String,
  })
  spec?: string

  @ApiProperty({
    name: 'attr',
    required: true,
    description: '物料属性，默认为自制',
    type: String,
  })
  attr: string = '自制'

  @ApiProperty({
    required: false,
    description: '物料类别',
    type: String,
  })
  category: string

  @ApiProperty({
    name: 'unit',
    required: false,
    description: '单位',
    type: String,
  })
  unit?: string



  @ApiProperty({
    name: 'status',
    required: true,
    description: '状态（启用/禁用），默认为启用',
    type: Boolean,
  })
  status: boolean = true

  @ApiProperty({
    name: 'remark',
    required: false,
    description: '备注',
    type: String,
  })
  remark?: string

  @ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String, })
  formData: string

  @ApiProperty({
    name: 'batNumber',
    required: false,
    description: '启动批号管理',
    type: Boolean,
  })
  batNumber?: boolean
}

export class FindByWarehouseDto{
  @ApiProperty({
    required: false,
    description: '仓库ID',
    type: Number,
  })
  @IsNotEmpty()
  warehouseId?: number

  @ApiProperty({
    required: false,
    description: '物料Id',
    type: [Number],
  })
  @IsNotEmpty()
  materialIds?: number[]
}





