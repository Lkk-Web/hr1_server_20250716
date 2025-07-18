import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

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
		description: '点检单号',
	})
	orderCode: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '点检人员',
	})
	checkUser: string;

	@ApiProperty({
		type: [String],
		required: false,
		description: '点检时间',
	})
	checkAt: string[];
}

export class CheckOrderDetailDto {
	@ApiProperty({
		type: String,
		required: true,
		description: '检查项名称',
	})
	name: string;

	@ApiProperty({
		type: String,
		required: true,
		description: '点检方法',
	})
	method: string;

	@ApiProperty({
		type: Number,
		required: false,
		description: '最小值',
	})
	min: number;

	@ApiProperty({
		type: Number,
		required: false,
		description: '最大值',
	})
	max: number;

	@ApiProperty({
		type: String,
		required: true,
		description: '检查结果',
	})
	result: string;

	@ApiProperty({
		type: Number,
		required: false,
		description: '其他',
	})
	another: number;

	@ApiProperty({
		type: [String],
		required: false,
		description: '拍照',
	})
	images: string[];
}

export class CCheckOrderDto{
	@ApiProperty({
		type: String,
		required: false,
		description: '点检单号',
	})
	code: string;

	@ApiProperty({
		type: Number,
		required: true,
		description: '设备台账Id',
	})
	equipmentLedgerId: number;

	@ApiProperty({
		type: Date,
		required: true,
		description: '点检时间',
	})
	checkAt: Date;

	@ApiProperty({
		type: Number,
		required: true,
		description: '点检员Id',
	})
	checkUserId: number;

	@ApiProperty({
		type: String,
		required: true,
		description: '设备状态',
	})
	status: string;

	@ApiProperty({
		type: String,
		required: true,
		description: '点检结果',
	})
	result: string;

	@ApiProperty({
		type: [CheckOrderDetailDto],
		required: false,
		description: '点检单明细数组',
	})
	details: CheckOrderDetailDto[];
}

export class UCheckOrderDto{
	@ApiProperty({
		type: Number,
		required: true,
		description: '设备台账Id',
	})
	equipmentLedgerId: number;

	@ApiProperty({
		type: Date,
		required: true,
		description: '点检时间',
	})
	checkAt: Date;

	@ApiProperty({
		type: Number,
		required: true,
		description: '点检员Id',
	})
	checkUserId: number;

	@ApiProperty({
		type: String,
		required: true,
		description: '设备状态',
	})
	status: string;

	@ApiProperty({
		type: String,
		required: true,
		description: '点检结果',
	})
	result: string;

	@ApiProperty({
		type: [CheckOrderDetailDto],
		required: false,
		description: '点检单明细数组',
	})
	details: CheckOrderDetailDto[];
}

//设备点检表查询
export class CheckOrderListDto {
	@ApiProperty({ type: Number, required: true, description: '设备台账id',})
	@IsNotEmpty({ message: '设备台账id不能为空' })
	equipmentId: number;

	@ApiProperty({ type: Date, required: true, description: '日期到月',})
	date: string;

}
