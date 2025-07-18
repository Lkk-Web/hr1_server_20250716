import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '点检标准编码',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '点检标准名称',
		type: String,
		required: false,
	})
	name: string;

	@ApiProperty({
		description: '检查项',
		type: String,
		required: false,
	})
	itemName: string;
}

export class checkStandardDetailDto {
	@ApiProperty({
		description: '检查项名称',
		example: '温度检查',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '点检方法',
		example: '目测',
		type: String,
		required: true,
	})
	method: string;

	@ApiProperty({
		description: '最小值',
		example: 0.00,
		type: Number,
		required: false,
	})
	min?: number;

	@ApiProperty({
		description: '最大值',
		example: 100.00,
		type: Number,
		required: false,
	})
	max?: number;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '该项用于温度检测',
		type: String,
		required: false,
	})
	remark?: string;
}

export class CCheckStandardDto {
	@ApiProperty({
		description: '点检标准编码',
		example: 'INS12345',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '点检标准名称',
		example: '设备日常检查标准',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '此标准用于日常设备点检',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '明细数组',
		type: [checkStandardDetailDto],
		required: false,
	})
	details?: checkStandardDetailDto[];
}

export class UCheckStandardDto {
	@ApiProperty({
		description: '点检标准名称',
		example: '设备日常检查标准',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '此标准用于日常设备点检',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '明细数组',
		type: [checkStandardDetailDto],
		required: false,
	})
	details?: checkStandardDetailDto[];
}
