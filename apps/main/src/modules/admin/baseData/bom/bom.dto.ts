import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    name: 'bomCode',
    required: false,
    description: '物料BOM编码',
    type: String,
  })
  bomCode?: string

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
    name: 'attr',
    required: false,
    description: '物料属性，默认为自制',
    type: String,
  })
  attr: string

  @ApiProperty({
    name: 'unit',
    required: false,
    description: '单位',
    type: String,
  })
  unit?: string
}

export class BomItemDto {
	@ApiProperty({
		name: 'sort',
		required: true,
		description: '序号',
		type: Number,
	})
	sort: number;

	@ApiProperty({
		name: 'materialId',
		required: true,
		description: 'materialId，外键，关联Material表',
		type: Number,
	})
	materialId: number;

	@ApiProperty({
		name: 'quantity',
		required: true,
		description: '数量',
		type: Number,
	})
	quantity: number;

}

export class CBomDto {

	@ApiProperty({
		name: 'code',
		required: false,
		description: '编码，忽略时自动生成',
		type: String,
	})
	code?: string

	@ApiProperty({
		name: 'materialId',
		required: true,
		description: '父物料Id，外键，关联物料表',
		type: Number,
	})
	materialId: number;

	@ApiProperty({
		name: 'remark',
		required: false,
		description: '备注',
		type: String,
	})
	remark?: string

	@ApiProperty({
		name: 'items',
		required: false,
		description: '子项数组',
		type: [BomItemDto],
	})
	items?: BomItemDto[]

	@ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String, })
	formData: string
}

export class UBomDto {

	@ApiProperty({
		name: 'code',
		required: false,
		description: '编码，忽略时自动生成',
		type: String,
	})
	code?: string

	@ApiProperty({
		name: 'materialId',
		required: false,
		description: '父物料Id，外键，关联物料表',
		type: Number,
	})
	materialId: number;

	@ApiProperty({
		name: 'remark',
		required: false,
		description: '备注',
		type: String,
	})
	remark?: string

	@ApiProperty({
		name: 'items',
		required: false,
		description: '子项数组',
		type: [BomItemDto],
	})
	items?: BomItemDto[]

	@ApiProperty({ name: 'formData', required: false, description: '工单表单的数据（JSON格式）', type: String, })
	formData: string
}





