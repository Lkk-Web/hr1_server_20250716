import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType } from 'sequelize-typescript'

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		required: false,
		description: '领料单号',
		type: String,
	})
	code: string

	@ApiProperty({
		name: 'requisitionAt',
		required: false,
		description: '领料时间',
		type: Date,
	})
	requisitionAt: Date

	@ApiProperty({
		required: false,
		description: '仓库名称',
		type: Number,
	})
	warehouseName: number

	@ApiProperty({
		required: false,
		description: '工单编号',
		type: String,
	})
	orderCode: string

	@Column({
		comment: '产品编号',
		type: DataType.STRING,
		allowNull: true,
	})
	declare materialCode: string

	@Column({
		comment: '产品名称',
		type: DataType.STRING,
		allowNull: true,
	})
	declare materialName: string

	@ApiProperty({
		required: false,
		description: '单据状态',
		type: String,
	})
	status?: string
}

export class MaterialRequisitionDetailDto {
	@ApiProperty({
		name: 'materialId',
		required: false,
		description: '物料Id',
		type: Number,
	})
	materialId: number

	@ApiProperty({
		name: 'count',
		required: false,
		description: '领用数量',
		type: Number,
	})
	count: number

	@ApiProperty({
		name: 'batNum',
		required: true,
		description: '批次号',
		type: String,
	})
	batNum?: string
}

export class CMaterialRequisitionDto {
	@ApiProperty({
		name: 'code',
		required: true,
		description: '领料单号',
		type: String,
	})
	code: string

	@ApiProperty({
		name: 'requisitionAt',
		required: true,
		description: '领料时间',
		type: Date,
	})
	requisitionAt: Date

	@ApiProperty({
		name: 'warehouseId',
		required: true,
		description: '仓库Id',
		type: Number,
	})
	warehouseId: number

	@ApiProperty({
		name: 'remark',
		required: false,
		description: '备注',
		type: String,
	})
	remark?: string


	@ApiProperty({
		name: 'pickerId',
		required: true,
		description: '领料人Id',
		type: Number,
	})
	pickerId: number

	@ApiProperty({
		name: 'productionOrderId',
		required: true,
		description: '工单Id',
		type: String,
	})
	productionOrderId: string


	declare details: any
}

export class UMaterialRequisitionDto {
	@ApiProperty({
		name: 'requisitionAt',
		required: true,
		description: '领料时间',
		type: Date,
	})
	requisitionAt: Date

	@ApiProperty({
		name: 'warehouseId',
		required: true,
		description: '仓库Id',
		type: Number,
	})
	warehouseId: number

	@ApiProperty({
		name: 'remark',
		required: false,
		description: '备注',
		type: String,
	})
	remark?: string


	@ApiProperty({
		name: 'pickerId',
		required: true,
		description: '领料人Id',
		type: Number,
	})
	pickerId: number

	@ApiProperty({
		name: 'productionOrderId',
		required: true,
		description: '工单Id',
		type: String,
	})
	productionOrderId: string

	declare details: any
}
