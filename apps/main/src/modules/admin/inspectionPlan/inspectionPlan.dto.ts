import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '巡检计划编码',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '巡检方案名称',
		example: '设备日常巡检方案',
		type: String,
		required: false,
	})
	name: string;

	@ApiProperty({
		description: '巡检频率',
		example: '每日',
		type: String,
		required: false,
	})
	frequency: string;
}

export class inspectionPlanDetailDTO {
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
}

export class CInspectionPlanDTO {
	@ApiProperty({
		description: '巡检计划编码',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '巡检方案名称',
		example: '设备日常巡检方案',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '巡检频率',
		example: '每日',
		type: String,
		required: true,
	})
	frequency: string;

	@ApiProperty({
		description: '当天规定巡检次数',
		example: 3,
		type: Number,
		required: false,
	})
	times?: number;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '该巡检计划适用于一般设备的日常巡检',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '巡检明细数组',
		type: [inspectionPlanDetailDTO],
		required: false,
	})
	details?: inspectionPlanDetailDTO[];
}

export class UInspectionPlanDTO {
	@ApiProperty({
		description: '巡检方案名称',
		example: '设备日常巡检方案',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '巡检频率',
		example: '每日',
		type: String,
		required: true,
	})
	frequency: string;

	@ApiProperty({
		description: '当天规定巡检次数',
		example: 3,
		type: Number,
		required: false,
	})
	times?: number;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '该巡检计划适用于一般设备的日常巡检',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '巡检明细数组',
		type: [inspectionPlanDetailDTO],
		required: false,
	})
	details?: inspectionPlanDetailDTO[];
}


