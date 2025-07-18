import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '设备名称',
	})
	name: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '设备编码',
	})
	code: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '报废单号',
	})
	orderCode: string;

	@ApiProperty({
		type: Date,
		required: false,
		description: '报废时间',
	})
	scrapAt: Date;
}

export class CScrapOrderDto{
	@ApiProperty({
		type: Number,
		required: true,
		description: '设备台账Id',
	})
	equipmentLedgerId: number;

	@ApiProperty({
		type: Date,
		required: true,
		description: '巡检时间',
	})
	scrapAt: Date;

	@ApiProperty({
		type: Number,
		required: true,
		description: '报废员Id',
	})
	scrapUserId: number;

	@ApiProperty({
		type: String,
		required: false,
		description: '报废原因',
	})
	reason: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '设备状态',
	})
	equipStatus: string;
}

export class UScrapOrderDto{
	@ApiProperty({
		type: Number,
		required: true,
		description: '设备台账Id',
	})
	equipmentLedgerId: number;

	@ApiProperty({
		type: Date,
		required: true,
		description: '巡检时间',
	})
	scrapAt: Date;

	@ApiProperty({
		type: Number,
		required: true,
		description: '报废员Id',
	})
	scrapUserId: number;

	@ApiProperty({
		type: String,
		required: false,
		description: '报废原因',
	})
	reason: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '设备状态',
	})
	equipStatus: string;
}
