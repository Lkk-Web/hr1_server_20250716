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
		description: '维修单号',
	})
	orderCode: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '设备编码',
	})
	code: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '设备编码',
	})
	name: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '维修状态',
	})
	status: string;

	@ApiProperty({
		type: [String],
		required: false,
		description: '报修时间',
	})
	repairDate: string[];
}

export class RepairActionDto{
	@ApiProperty({
		type: [Number],
		required: true,
		description: '维修单Id数组',
	})
	@IsNotEmpty({message:"维修单为必选"})
	ids: number[];

	@ApiProperty({
		type: String,
		required: true,
		description: '操作类型',
	})
	action: string;
}

export class RepairOrderReceiveDTO {
	@ApiProperty({
		type: Boolean,
		required: true,
		description: '是否修复',
	})
	isRepaired: boolean;

	@ApiProperty({
		type: String,
		required: true,
		description: '设备状态',
	})
	status: string;

	@ApiProperty({
		type: Number,
		required: true,
		description: '维修评分',
	})
	score: number;

	@ApiProperty({
		type: String,
		required: false,
		description: '维修评价',
	})
	evaluate: string;
}

export class RepairOrderResultDTO {
	@ApiProperty({
		type: Boolean,
		required: true,
		description: '是否进行维修',
	})
	isRepair: boolean;

	@ApiProperty({
		type: String,
		required: false,
		description: '作废原因',
	})
	cancelReason: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '故障类别',
	})
	type: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '故障原因',
	})
	faultReason: string;

	@ApiProperty({
		type: String,
		required: false,
		description: '维修情况说明',
	})
	explain: string;

	@ApiProperty({
		type: Number,
		required: true,
		description: '维修人Id',
	})
	repairUserId: number;
}

export class RepairOrderDetailDTO {
	@ApiProperty({
		type: String,
		required: true,
		description: '故障描述',
	})
	description: string;

	@ApiProperty({
		type: [String],
		required: false,
		description: '故障描述图片',
	})
	images: string[];

	@ApiProperty({
		type: [String],
		required: false,
		description: '故障视频',
	})
	videos: string[];

	@ApiProperty({
		type: Date,
		required: true,
		description: '报修时间',
	})
	repairDate: Date;

	@ApiProperty({
		type: Number,
		required: true,
		description: '报修人ID',
	})
	reportUserId: number;
}

export class CRepairOrderDto{
	@ApiProperty({
		type: String,
		required: false,
		description: '维修单号',
	})
	code: string;

	@ApiProperty({
		type: Number,
		required: true,
		description: '设备台账Id',
	})
	equipmentLedgerId: number;

	@ApiProperty({
		type: String,
		required: true,
		description: '维修状态',
	})
	status: string;

	@ApiProperty({
		type: RepairOrderDetailDTO,
		required: true,
		description: '故障报修',
	})
	detail: RepairOrderDetailDTO;

}

export class URepairOrderDto{
	@ApiProperty({
		type: Number,
		required: true,
		description: '设备台账Id',
	})
	equipmentLedgerId: number;

	@ApiProperty({
		type: RepairOrderDetailDTO,
		required: true,
		description: '故障报修',
	})
	detail: RepairOrderDetailDTO;

	@ApiProperty({
		type: RepairOrderResultDTO,
		required: true,
		description: '维修结果',
	})
	result: RepairOrderDetailDTO;

	@ApiProperty({
		type: RepairOrderReceiveDTO,
		required: true,
		description: '结果验收',
	})
	receive: RepairOrderReceiveDTO;
}
