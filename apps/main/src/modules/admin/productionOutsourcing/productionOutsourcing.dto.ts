import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({ description: '工单编号', type: String, required: false, })
	orderCode: string

	@ApiProperty({ description: '产品编号', type: String, required: false, })
	materialCode: string

	@ApiProperty({ description: '产品名称', type: String, required: false, })
	materialName: string

	@ApiProperty({ description: '工序名称', type: String, required: false, })
	processName: string

	@ApiProperty({ description: '供应商名称', type: String, required: false, })
	supplierName: string

	@ApiProperty({ description: '开始时间', type: Date, required: false, })
	startTime: Date

	@ApiProperty({ description: '结束时间', type: Date, required: false, })
	endTime: Date
}

export class CProductionOutsourcingDto {
	@ApiProperty({ type: String, required: false, description: '工序委外单编号' })
	code: string;
	@ApiProperty({ type: String, required: false, description: '工单Id', })
	productionOrderId: string;
	@ApiProperty({ type: Number, required: false, description: '产品ID', })
	materialId: number;
	@ApiProperty({ type: Number, required: false, description: '工序Id' })
	processId: number;
	@ApiProperty({ type: Number, required: false, description: '工序任务单ID' })
	taskId: number;
	@ApiProperty({ type: String, required: true, description: '状态（未审核，已审核）' })
	status: string;
	@ApiProperty({ type: String, required: true, description: '单据类型（委外发出,委外接收）' })
	types: string;
	@ApiProperty({ type: Number, required: true, description: '供应商id' })
	supplierId: number;
	@ApiProperty({ type: Date, required: false, description: '单据日期' })
	startTime: Date;
	@ApiProperty({ type: Number, required: true, description: '委外数量' })
	num: number;
	@ApiProperty({ type: Number, required: true, description: '接收数量' })
	endNum: number;
	@ApiProperty({ type: String, required: false, description: '单位' })
	unit: string;
	@ApiProperty({ type: Number, required: false, description: '良品单价（元）' })
	goodCountPrice: number;
	@ApiProperty({ type: Number, required: false, description: '不良品单价（元）' })
	badCountPrice: number;
	@ApiProperty({ type: Number, required: false, description: '预估结算金额（元）' })
	estimatedWage: number;
	@ApiProperty({ type: Number, required: false, description: '良品数' })
	goodCount: number;
	@ApiProperty({ type: Number, required: false, description: '不良品数' })
	badCount: number;
}

export class UProductionOutsourcingDto {
	@ApiProperty({ type: String, required: false, description: '工单Id', })
	productionOrderId: string;
	@ApiProperty({ type: Number, required: false, description: '工序Id' })
	processId: number;
	@ApiProperty({ type: Number, required: false, description: '产品ID', })
	materialId: number;
	@ApiProperty({ type: Number, required: false, description: '工序任务单ID' })
	taskId: number;
	@ApiProperty({ type: String, required: true, description: '状态（未审核，已审核）' })
	status: string;
	@ApiProperty({ type: Number, required: true, description: '供应商id' })
	supplierId: number;
	@ApiProperty({ type: Date, required: false, description: '单据日期' })
	startTime: Date;
	@ApiProperty({ type: Number, required: true, description: '委外数量' })
	num: number;
	@ApiProperty({ type: Number, required: true, description: '接收数量' })
	endNum: number;
	@ApiProperty({ type: String, required: false, description: '单位' })
	unit: string;
	@ApiProperty({ type: Number, required: false, description: '良品单价（元）' })
	goodCountPrice: number;
	@ApiProperty({ type: Number, required: false, description: '不良品单价（元）' })
	badCountPrice: number;
	@ApiProperty({ type: Number, required: false, description: '预估结算金额（元）' })
	estimatedWage: number;
	@ApiProperty({ type: Number, required: false, description: '良品数' })
	goodCount: number;
	@ApiProperty({ type: Number, required: false, description: '不良品数' })
	badCount: number;
}

