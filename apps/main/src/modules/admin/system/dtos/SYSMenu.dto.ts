import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SYSMenu } from '@model/sys/SYSMenu.model';

export class FindPaginationDto {
	@ApiProperty({ description: '菜单名称', type: String, required: false })
	name: string;

	@ApiProperty({ description: '父级id', type: Number, required: false })
	parentId: number;

	@ApiProperty({ description: '类型', type: String, required: false })
	types: string;

	@ApiProperty({ description: '权限标识', type: String, required: false })
	perms: string;

	@ApiProperty({ description: '状态（0隐藏 1显示 ）', type: Number, required: false })
	status: number;
}

export class CSYSMenuDto {
	@ApiProperty({ description: '菜单名称', type: String })
	name: string;

	@ApiProperty({ description: '父级id', type: Number, required: false })
	parentId: number;

	@ApiProperty({ description: '菜单类型（M目录 C菜单 F按钮）', type: String, required: true, enum: ['M', 'C', 'F'], example: 'M' })
	types: string;

	@ApiProperty({ description: '菜单url', type: String, required: false })
	url: string;

	@ApiProperty({ description: '图标', type: String, required: false })
	icon: string;

	@ApiProperty({ description: '权限标识', type: String, required: false })
	perms: string;

	@ApiProperty({ description: '状态（0隐藏 1显示 ）', type: Number, required: false })
	status: number;

	@ApiProperty({ description: '排序', type: Number, required: false })
	sort: number;
}

export class ESYSMenuDto {
	@ApiProperty({ description: '菜单名称', type: String })
	name: string;

	@ApiProperty({ description: '父级id', type: Number, required: false })
	parentId: number;

	@ApiProperty({ description: '菜单类型（M目录 C菜单 F按钮）', type: String, required: true, enum: ['M', 'C', 'F'], example: 'M' })
	types: string;

	@ApiProperty({ description: '菜单url', type: String, required: false })
	url: string;

	@ApiProperty({ description: '图标', type: String, required: false })
	icon: string;

	@ApiProperty({ description: '权限标识', type: String, required: false })
	perms: string;

	@ApiProperty({ description: '状态（0隐藏 1显示 ）', type: Number, required: false })
	status: number;

	@ApiProperty({ description: '排序', type: Number, required: false })
	sort: number;
}
