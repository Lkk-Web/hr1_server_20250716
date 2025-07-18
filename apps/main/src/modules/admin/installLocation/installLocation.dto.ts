import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '地点',
		type: String,
		required: false,
	})
	locate: string;
}

export class CInstallLocationDTO {
	@ApiProperty({
		description: '地点',
		example: '生产车间A区',
		type: String,
		required: true,
	})
	locate: string;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '此区域用于大型设备的安装',
		type: String,
		required: false,
	})
	remark?: string;
}

export class UInstallLocationDTO {
	@ApiProperty({
		description: '地点',
		example: '生产车间A区',
		type: String,
		required: true,
	})
	locate: string;

	@ApiProperty({
		description: '状态，true 表示启用，false 表示禁用',
		example: true,
		type: Boolean,
		required: true,
	})
	status: boolean;

	@ApiProperty({
		description: '备注',
		example: '此区域用于大型设备的安装',
		type: String,
		required: false,
	})
	remark?: string;
}


