import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '设备名称',
		example: '数控车床',
		required:false,
		type:String
	})
	name: string;

	@ApiProperty({
		description: '设备类型',
		type:String,
		required:false
	})
	equipmentType: string;

	@ApiProperty({
		description: '设备类型Id',
		type:Number,
		required:false
	})
	equipmentTypeId: number;
}

export class CEquipmentDTO {
	@ApiProperty({
		description: '设备名称',
		example: '数控车床',
		type: String,
		required:true,
	})
	name: string;

	@ApiProperty({
		description: '设备类型 ID',
		example: 1,
		type: Number,
		required:true,
	})
	equipmentTypeId: number;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required:true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '此设备用于精密加工',
		required: false,
		type: String,
	})
	remark?: string;
}

export class UEquipmentDTO {
	@ApiProperty({
		description: '设备名称',
		example: '数控车床',
		type: String,
		required:true,
	})
	name: string;

	@ApiProperty({
		description: '设备类型 ID',
		example: 1,
		type: Number,
		required:true,
	})
	equipmentTypeId: number;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required:true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '此设备用于精密加工',
		required: false,
		type: String,
	})
	remark?: string;
}
