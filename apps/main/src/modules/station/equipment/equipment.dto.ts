import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CheckOrderDetailDto } from '@modules/admin/checkOrder/checkOrder.dto'
import { RepairOrderDetailDTO } from '@modules/admin/repairOrder/repairOrder.dto'


export class CPadRepairOrderDto{
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

	@ApiProperty({
		type: Number,
		required: true,
		description: '报修人ID',
	})
	reportUserId: number;

}
