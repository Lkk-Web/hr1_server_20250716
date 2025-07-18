import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '订单编号',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '产品编号',
		type: String,
		required: false,
	})
	materialCode: string;

	@ApiProperty({
		description: '产品名称',
		type: String,
		required: false,
	})
	materialName: string;

	@ApiProperty({
		description: '客户名称',
		type: String,
		required: false,
	})
	customerName: string;

	@ApiProperty({
		description: '要货日期',
		type: Date,
		required: false,
	})
	deliveryDate?: Date;

	@ApiProperty({
		description: '仓库Id',
		type: Number,
		required: false,
	})
	warehouseId: number;
}

export class SalesOrderDetailDto {
	@ApiProperty({
		description: '产品Id',
		type: Number,
		example: 1001,
	})
	materialId: number;

	@ApiProperty({
		description: '单价',
		type: Number,
		example: 85.00,
	})
	unitPrice: number;

	@ApiProperty({
		description: '数量',
		type: Number,
		example: 10.00,
	})
	quantity: number;

	@ApiProperty({
		description: '金额',
		type: Number,
		example: 850.00,
	})
	amount: number;
}


export class CSalesOrderDto {
	@ApiProperty({
		description: '订单编号',
		type: String,
		example: 'XSD2410001',
		required: true,
	})
	code: string;

	@ApiProperty({
		description: '订单日期',
		type: Date,
		example: '2024-11-04',
		required: true,
	})
	orderDate: Date;

	@ApiProperty({
		description: '客户ID',
		type: Number,
		example: 1,
		required: true,
	})
	customerId: number;

	@ApiProperty({
		description: '要货日期',
		type: Date,
		example: '2024-11-16',
		required: false,
	})
	deliveryDate?: Date;

	@ApiProperty({
		description: '订单状态',
		type: String,
		example: '已审核',
		required: true,
	})
	status: string;

	@ApiProperty({
		description: '订单明细',
		type: [SalesOrderDetailDto],
		required: false,
	})
	details: SalesOrderDetailDto[];

	@ApiProperty({
		description: '备注',
		type: String,
		example: '这是一个备注.',
		required: false,
	})
	remark: string
}

export class USalesOrderDto {

	@ApiProperty({
		description: '订单日期',
		type: Date,
		example: '2024-11-04',
		required: false,
	})
	orderDate?: Date;

	@ApiProperty({
		description: '客户ID',
		type: Number,
		example: 1,
		required: false,
	})
	customerId?: number;

	@ApiProperty({
		description: '要货日期',
		type: Date,
		example: '2024-11-16',
		required: false,
	})
	deliveryDate?: Date;

	@ApiProperty({
		description: '订单状态',
		type: String,
		example: '未审核',
		required: false,
	})
	status?: string;

	@ApiProperty({
		description: '备注',
		type: String,
		example: '这是一个备注.',
		required: false,
	})
	remark: string

	@ApiProperty({
		description: '订单明细',
		type: [SalesOrderDetailDto],
		required: false,
	})
	details: SalesOrderDetailDto[];
}
