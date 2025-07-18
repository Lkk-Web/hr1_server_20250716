import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '保养单编码',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '保养方案名称',
		example: '设备日常保养方案',
		type: String,
		required: false,
	})
	name: string;

	@ApiProperty({
		description: '保养频率',
		example: '每日',
		type: String,
		required: false,
	})
	frequency: string;
}

export class maintenancePlanDetailDto {
	@ApiProperty({
		description: '保养项名称',
		example: '温度检查',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '保养方法',
		example: '目测',
		type: String,
		required: true,
	})
	method: string;

	@ApiProperty({
		type: String,
		required: true,
	})
	type: string;

}

export class CMaintenancePlanDto{
	@ApiProperty({
		description: '保养计划编码',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '保养方案名称',
		example: '设备日常保养方案',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '保养频率',
		example: '每日',
		type: String,
		required: true,
	})
	frequency: string;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '该保养计划适用于一般设备的日常保养',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '保养明细数组',
		type: [maintenancePlanDetailDto],
		required: false,
	})
	details?: maintenancePlanDetailDto[];
}

export class UMaintenancePlanDto{
	@ApiProperty({
		description: '保养方案名称',
		example: '设备日常保养方案',
		type: String,
		required: true,
	})
	name: string;

	@ApiProperty({
		description: '保养频率',
		example: '每日',
		type: String,
		required: true,
	})
	frequency: string;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '该保养计划适用于一般设备的日常保养',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '保养明细数组',
		type: [maintenancePlanDetailDto],
		required: false,
	})
	details?: maintenancePlanDetailDto[];
}
