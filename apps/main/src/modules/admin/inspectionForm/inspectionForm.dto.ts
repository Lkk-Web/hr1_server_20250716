import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional } from 'class-validator'

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;
	@ApiProperty({ name: 'code', type: String, required: false, description: '检验单编码' })
	code: string
	@ApiProperty({ name: 'inspectionAt', type: Date, required: false, description: '检验日期' })
	inspectionAt: string | number | any
	@ApiProperty({ name: 'inspectorName', type: String, required: false, description: '质检人' })
	inspectorName: string
	@ApiProperty({ name: 'status', type: String, required: false, description: '状态' })
	status: string
	@ApiProperty({ name: 'originCode', type: String, required: false, description: '来源单据编码' })
	originCode: string

	@ApiProperty({ type: Number, required: false, description: '工序Id' })
	processId: number
}

export class InspectionResultDto {

	@ApiProperty({
		type: String,
		description: '不良品描述',
		required: true,
	})
	desc: string;

	@ApiProperty({
		type: Number,
		description: '不良品数量',
		example: 50,
		required: true,
	})
	count: number;

	@ApiProperty({
		type: String,
		description: '不良品处理建议',
		required: true,
	})
	handle: string;

	@ApiProperty({
		type: Boolean,
		description: '是否开启评审',
		default:false,
		required: false,
	})
	isReview: boolean;

	@ApiProperty({
		type: Number,
		description: '返工,工序id',
		required: false,
	})
	processId: number;

	@ApiProperty({
		type: String,
		description: '评审建议',
		required: false,
	})
	review: string;

	@ApiProperty({
		type: String,
		description: '判定结果',
		required: true,
	})
	result: string;
}

export class InspectionItemDto {
	@ApiProperty({ type: String, required: true, description: 'JSON数据' })
	data: string;
}

class InspectInfoDto {
	@ApiProperty({
		type: Number,
		description: '检验结果(0:不合格,1:合格)',
		example: 1,
		required: false,
	})
	result?: number;

	@ApiProperty({
		type: Number,
		description: '质检状态(0:计划,1:质检完成)',
		example: 1,
		required: false,
	})
	status?: number;

	@ApiProperty({
		type: Number,
		description: '检验数',
		example: 100,
		required: false,
	})
	count?: number;

	@ApiProperty({
		type: Number,
		description: '合格数量',
		example: 100,
		required: false,
	})
	goodCount?: number;

	@ApiProperty({
		type: Number,
		description: '不合格数量',
		example: 20,
		required: false,
	})
	badCount?: number;

	@ApiProperty({
		type: Number,
		description: '检验模板Id',
		example: 5,
		required: false,
	})
	templateId?: number;

	@ApiProperty({
		type: Number,
		description: '物料Id',
		example: 101,
		required: false,
	})
	materialId?: number;

	@ApiProperty({
		type: InspectionItemDto,
		description: '检验项次',
		required: false,
	})
	item?: InspectionItemDto;

/*	@ApiProperty({
		type: [InspectionItemDto],
		description: '检验项次数组',
		required: false,
	})
	items?: InspectionItemDto[];*/

	@ApiProperty({
		type: [InspectionResultDto],
		description: '检验结果数组',
		required: false,
	})
	results?: InspectionResultDto[];
}

export class UInspectionFormDto {
	@ApiProperty({ type: [InspectInfoDto], description: '物料明细数组', required: false })
	infos?: InspectInfoDto[];

	@ApiProperty({ type: [Number], description: '质检人id', required: false })
	@IsOptional()
	@IsNumber({},{each:true,message:'质检人id必须是数字'})
	inspectorIds?: number[];
}

export class AuditDto {
	@ApiProperty({ required: false, description: '状态(审核/取消审核)', type: String })
	status: string

	@ApiProperty({
		description: 'id数组',
		type: [Number],
		required: false,
	})
	ids?: number[]
}
