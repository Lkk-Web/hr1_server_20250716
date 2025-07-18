import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		name: 'name',
		required: false,
		description: '检验项次名称',
		type: String,
	})
	name: string;

	@ApiProperty({
		name: 'type',
		required: false,
		description: '检验项类型',
		type: String,
	})
	type: string;

	@ApiProperty({
		name: 'status',
		required: false,
		description: '状态（true 表示启用，false 表示禁用）',
		type: Boolean,
	})
	status: boolean;

	@ApiProperty({
		required: false,
		description: '过滤Id数组',
		type: [Number],
	})
	filterIds: Number[];
}

export class CInspectionItemDTO {
	@ApiProperty({
		name: 'name',
		required: true,
		description: '检验项次名称',
		type: String,
	})
	name: string;

	@ApiProperty({
		name: 'type',
		required: true,
		description: '检验项类型',
		type: String,
	})
	type: string;

	@ApiProperty({
		name: 'tool',
		required: true,
		description: '检验工具',
		type: String,
	})
	tool: string;

	@ApiProperty({
		name: 'requirement',
		required: false,
		description: '检验要求（可选）',
		type: String,
	})
	requirement?: string;

	@ApiProperty({
		name: 'status',
		required: true,
		description: '状态（true 表示启用，false 表示禁用）',
		type: Boolean,
	})
	status: boolean;
}

export class UInspectionItemDTO {
	@ApiProperty({
		name: 'name',
		required: true,
		description: '检验项次名称',
		type: String,
	})
	name: string;

	@ApiProperty({
		name: 'type',
		required: true,
		description: '检验项类型',
		type: String,
	})
	type: string;

	@ApiProperty({
		name: 'tool',
		required: true,
		description: '检验工具',
		type: String,
	})
	tool: string;

	@ApiProperty({
		name: 'requirement',
		required: false,
		description: '检验要求（可选）',
		type: String,
	})
	requirement?: string;

	@ApiProperty({
		name: 'status',
		required: true,
		description: '状态（true 表示启用，false 表示禁用）',
		type: Boolean,
	})
	status: boolean;
}
