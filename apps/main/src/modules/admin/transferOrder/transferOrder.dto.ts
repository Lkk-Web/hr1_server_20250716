import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransferOrder } from '@model/wm/transferOrder.model'

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '调拨单号',
		type: String,
		example: 'DB2410001',
		required: false,
	})
	code: string

	@ApiProperty({
		description: '调拨类型',
		type: String,
		example: '正常移仓',
		required: true,
	})
	type: string

	@ApiProperty({
		description: '调拨时间',
		type: Date,
		example: '2024-10-21T10:20:30Z',
		required: false,
	})
	transferTime: Date

	@ApiProperty({
		description: '调出仓库',
		type: String,
		example: '原料仓',
		required: true,
	})
	outWarehouse: string

	@ApiProperty({
		description: '调入仓库',
		type: String,
		example: '备用仓',
		required: true,
	})
	intoWarehouse: string
}

export class TransferOrderDetailDto {
	@ApiProperty({
		description: '物料Id',
		type: Number,
		required: false,
	})
	materialId: number

	@ApiProperty({
		description: '仓库数量',
		type: Number,
		required: false,
	})
	warehouseCount: number

	@ApiProperty({
		description: '调拨数量',
		type: Number,
		required: false,
	})
	count: number
}

export class CTransferOrderDto {
	@ApiProperty({
		description: '调拨单号',
		type: String,
		example: 'INB12345',
		required: false,
	})
	code: string

	@ApiProperty({
		description: '调拨类型',
		type: String,
		example: '采购调拨',
		required: true,
	})
	type: string

	@ApiProperty({
		description: '调拨时间',
		type: Date,
		example: '2024-10-21T10:20:30Z',
		required: false,
	})
	transferTime: Date

	@ApiProperty({
		description: '调出仓库ID',
		type: Number,
		example: 3,
		required: true,
	})
	outWarehouseId: number

	@ApiProperty({
		description: '调入仓库ID',
		type: Number,
		example: 3,
		required: true,
	})
	intoWarehouseId: number

	@ApiProperty({
		description: '备注',
		type: String,
		example: '这是一个备注.',
		required: false,
	})
	remark: string

	@ApiProperty({
		description: '调拨明细数组',
		type: [TransferOrderDetailDto],
		required: false,
	})
	details: TransferOrderDetailDto[]
}

export class UTransferOrderDto {
	@ApiProperty({
		description: '调拨类型',
		type: String,
		example: '采购调拨',
		required: true,
	})
	type: string

	@ApiProperty({
		description: '调拨时间',
		type: Date,
		example: '2024-10-21T10:20:30Z',
		required: false,
	})
	transferTime: Date

	@ApiProperty({
		description: '调出仓库ID',
		type: Number,
		example: 3,
		required: true,
	})
	outWarehouseId: number

	@ApiProperty({
		description: '调入仓库ID',
		type: Number,
		example: 3,
		required: true,
	})
	intoWarehouseId: number

	@ApiProperty({
		description: '备注',
		type: String,
		example: '这是一个备注.',
		required: false,
	})
	remark: string

	@ApiProperty({
		description: '调拨明细数组',
		type: [TransferOrderDetailDto],
		required: false,
	})
	details: TransferOrderDetailDto[]
}
