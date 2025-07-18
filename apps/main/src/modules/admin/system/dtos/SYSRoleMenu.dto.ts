import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SYSRoleMenu } from '@model/sys/SYSRoleMenu.model';
import { DATA_SCOPE_TYPE } from '@common/constant';

export class FindPaginationDto {
	@ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
	current?: string;
	@ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
	pageSize?: string;
}

export class CSYSRoleMenuDto {
	@ApiProperty({ description: '角色id', type: Number })
	roleId: number;

	@ApiProperty({ description: '菜单id', type: Number })
	menuId: number;

	@ApiProperty({ description: '组织编号', type: String })
	orgCode: string;
}

export class ESYSRoleMenuDto {
	@ApiProperty({ description: '角色id', type: Number })
	roleId: number;

	@ApiProperty({ description: '菜单id', type: Number })
	menuId: number;

	@ApiProperty({ description: '组织编号', type: String })
	orgCode: string;
}

class arr {
	@ApiProperty({ description: '菜单id', type: Number })
	menuId: number;

	@ApiProperty({ description: '操作编号', type: [String] })
	code: [string];

	@ApiProperty({ description: '状态 0/1', type: Number, required: false })
	status: number;

	@ApiProperty({
		description: '数据权限范围类型 全部/本部门/仅本人/自定义',
		type: Number,
		enum: Object.values(DATA_SCOPE_TYPE),
	})
	dataScopeType: DATA_SCOPE_TYPE;

	@ApiProperty({ description: '部门ID', type: [Number] })
	depts: number[];
}

export class ESYSRoleMenuPowerDto {
	@ApiProperty({ description: '数组对象', type: [arr] })
	arr: arr[];
}
