import { ApiProperty } from '@nestjs/swagger'

export class EquipmentLPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;

	@ApiProperty({
		description: '设备台账编码',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '设备名称',
		type: String,
		required: false,
	})
	name: string;

	@ApiProperty({
		description: '设备规格',
		type: String,
		required: false,
	})
	spec: string;

	@ApiProperty({
		description: '设备状态',
		type: String,
		required: false,
	})
	status: string;

	@ApiProperty({
		description: '车间名称',
		type: String,
		required: false,
	})
	workShopName?: string;

	@ApiProperty({
		description: '供应商名称',
		type: String,
		required: false,
	})
	supplierName?: string;

	@ApiProperty({
		description: '过滤已经被班组选择的设备',
		type: Number,
		required: false,
		example:[0,1]
	})
	filterTeam?: number;
}

export class CEquipmentLedgerDTO {
	@ApiProperty({
		description: '设备台账编码',
		example: 'EQPT001',
		type: String,
		required: false,
	})
	code: string;

	@ApiProperty({
		description: '设备类型Id',
		example: 1,
		type: Number,
		required: true,
	})
	equipmentTypeId: number;

	@ApiProperty({
		description: '设备Id',
		example: 123,
		type: Number,
		required: true,
	})
	equipmentId: number;

	@ApiProperty({
		description: '设备状态',
		example: '在用',
		type: String,
		required: true,
	})
	status: string;

	@ApiProperty({
		description: '设备规格',
		example: '500x400x300',
		type: String,
		required: false,
	})
	spec: string;

	@ApiProperty({
		description: '设备图片',
		example: '[http://example.com/image.jpg]',
		type: String,
		required: false,
	})
	image: string[];

	@ApiProperty({
		description: '技术手册文件Id',
		example: 10,
		type: Number,
		required: false,
	})
	fileId?: number;

	@ApiProperty({
		description: '车间Id',
		example: 2,
		type: Number,
		required: false,
	})
	workShopId?: number;

	@ApiProperty({
		description: '安装地点Id',
		example: 3,
		type: Number,
		required: false,
	})
	installLocationId?: number;

	@ApiProperty({
		description: '生产厂家Id',
		example: 4,
		type: Number,
		required: false,
	})
	manufacturerId?: number;

	@ApiProperty({
		description: '供应商Id',
		example: 5,
		type: Number,
		required: false,
	})
	supplierId?: number;

	@ApiProperty({
		description: '购买日期',
		example: '2023-05-20',
		type: Date,
		required: false,
	})
	purchaseDate?: Date;

	@ApiProperty({
		description: '启用日期',
		example: '2023-06-01',
		type: Date,
		required: false,
	})
	activationDate?: Date;

	@ApiProperty({
		description: '备注',
		example: '该设备用于生产车间',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '点检标准Id',
		example: 5,
		type: Number,
		required: false,
	})
	checkStandardId?: number;

	@ApiProperty({
		description: '巡检计划Id',
		example: 5,
		type: Number,
		required: false,
	})
	inspectionPlanId?: number;


}

export class UEquipmentLedgerDTO {

	@ApiProperty({
		description: '设备类型Id',
		example: 1,
		type: Number,
		required: true,
	})
	equipmentTypeId: number;

	@ApiProperty({
		description: '设备Id',
		example: 123,
		type: Number,
		required: true,
	})
	equipmentId: number;

	@ApiProperty({
		description: '设备状态',
		example: '在用',
		type: String,
		required: true,
	})
	status: string;

	@ApiProperty({
		description: '设备规格',
		example: '500x400x300',
		type: String,
		required: false,
	})
	spec: string;

	@ApiProperty({
		description: '设备图片',
		example: '[http://example.com/image.jpg]',
		type: String,
		required: false,
	})
	image: string[];

	@ApiProperty({
		description: '技术手册文件Id',
		example: 10,
		type: Number,
		required: false,
	})
	fileId?: number;

	@ApiProperty({
		description: '车间Id',
		example: 2,
		type: Number,
		required: false,
	})
	workShopId?: number;

	@ApiProperty({
		description: '安装地点Id',
		example: 3,
		type: Number,
		required: false,
	})
	installLocationId?: number;

	@ApiProperty({
		description: '生产厂家Id',
		example: 4,
		type: Number,
		required: false,
	})
	manufacturerId?: number;

	@ApiProperty({
		description: '供应商Id',
		example: 5,
		type: Number,
		required: false,
	})
	supplierId?: number;

	@ApiProperty({
		description: '购买日期',
		example: '2023-05-20',
		type: Date,
		required: false,
	})
	purchaseDate?: Date;

	@ApiProperty({
		description: '启用日期',
		example: '2023-06-01',
		type: Date,
		required: false,
	})
	activationDate?: Date;

	@ApiProperty({
		description: '备注',
		example: '该设备用于生产车间',
		type: String,
		required: false,
	})
	remark?: string;

	@ApiProperty({
		description: '点检标准Id',
		example: 5,
		type: Number,
		required: false,
	})
	checkStandardId?: number;

	@ApiProperty({
		description: '巡检计划Id',
		example: 5,
		type: Number,
		required: false,
	})
	inspectionPlanId?: number;
}
