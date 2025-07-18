import { ApiProperty } from '@nestjs/swagger'

// 检验方案类型枚举
export enum InspectionTemplateTypeEnum {
	GENERAL = '通用',
	MATERIAL = '物料'
}

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		required: false,
		description: '检验模板编码',
		type: String,
	})
	code: string

	@ApiProperty({
		name: 'name',
		required: false,
		description: '检验模板名称',
		type: String,
	})
	name: string

	@ApiProperty({
		name: 'templateType',
		required: false,
		description: '检验方案类型',
		enum: InspectionTemplateTypeEnum,
	})
	templateType: InspectionTemplateTypeEnum

	@ApiProperty({
		name: 'type',
		required: false,
		description: '检验种类',
		type: String,
	})
	type: string

}

export class InspectionTemplateItemDTO {
	@ApiProperty({
		name: 'inspectionItemId',
		required: true,
		description: '检验项次',
		type: Number,
	})
	inspectionItemId: number

	@ApiProperty({
		name: 'standardValue',
		required: false,
		description: '标准值',
		type: String,
	})
	standardValue?: string

	@ApiProperty({
		name: 'unit',
		required: false,
		description: '单位',
		type: String,
	})
	unit?: string

	@ApiProperty({
		name: 'upperLimit',
		required: false,
		description: '误差上限',
		type: String,
	})
	upperLimit?: string

	@ApiProperty({
		name: 'lowerLimit',
		required: false,
		description: '误差下限',
		type: String,
	})
	lowerLimit?: string
}

export class CInspectionTemplateDTO {
	@ApiProperty({
		name: 'name',
		required: true,
		description: '检验模板名称',
		type: String,
	})
	name: string

	@ApiProperty({
		name: 'templateType',
		required: true,
		description: '检验方案类型',
		enum: InspectionTemplateTypeEnum,
	})
	templateType: InspectionTemplateTypeEnum

	@ApiProperty({
		name: 'type',
		required: true,
		description: '检验种类',
		type: String,
	})
	type: string

	@ApiProperty({
		name: 'ttId',
		required: true,
		description: '检验种类Id（动态字段模版Id）',
		type: Number,
	})
	ttId: number

	@ApiProperty({
		name: 'status',
		required: true,
		description: '状态',
		type: Boolean,
	})
	status: boolean

	@ApiProperty({
		name: 'remark',
		required: false,
		description: '备注',
		type: String,
	})
	remark?: string

	@ApiProperty({
		required: false,
		description: '其他数据',
		type: String,
	})
	data?: string

	declare items?: any

	// materialIds只在物料类型时需要
	declare materialIds?: any
}

export class UInspectionTemplateDTO {
	@ApiProperty({
		name: 'name',
		required: true,
		description: '检验模板名称',
		type: String,
	})
	name: string

	@ApiProperty({
		name: 'templateType',
		required: true,
		description: '检验方案类型',
		enum: InspectionTemplateTypeEnum,
	})
	templateType: InspectionTemplateTypeEnum

	@ApiProperty({
		name: 'type',
		required: true,
		description: '检验种类',
		type: String,
	})
	type: string

	@ApiProperty({
		name: 'ttId',
		required: true,
		description: '检验种类Id（动态字段模版Id）',
		type: Number,
	})
	ttId: number

	@ApiProperty({
		name: 'status',
		required: true,
		description: '状态',
		type: Boolean,
	})
	status: boolean

	@ApiProperty({
		name: 'remark',
		required: false,
		description: '备注',
		type: String,
	})
	remark?: string

	@ApiProperty({
		required: false,
		description: '其他数据',
		type: String,
	})
	data?: string

	declare items?: any

	// materialIds只在物料类型时需要
	declare materialIds?: any
}
