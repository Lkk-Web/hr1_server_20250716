import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;
	@ApiProperty({
		type : String,
		description: '设备类型名称',
		example: '压力传感器',
		required:false,
	})
	name: string;
}

export class CEquipmentTypeDTO {
	@ApiProperty({
		description: '设备类型名称',
		example: '压力传感器',
		required: true,
	})
	name: string;

	@ApiProperty({
		type : Boolean,
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		default: true,
		required:true,
	})
	status: boolean;

	@ApiProperty({
		type : String,
		description: '备注',
		example: '此设备类型用于检测压力变化',
		required: false,
	})
	remark?: string;
}

export class UEquipmentTypeDTO {
	@ApiProperty({
		description: '设备类型名称',
		example: '压力传感器',
		required: true,
	})
	name: string;

	@ApiProperty({
		type : Boolean,
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		default: true,
		required:true,
	})
	status: boolean;

	@ApiProperty({
		type : String,
		description: '备注',
		example: '此设备类型用于检测压力变化',
		required: false,
	})
	remark?: string;
}
