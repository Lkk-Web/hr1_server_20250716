import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SYSRole } from '@model/sys/SYSRole.model';

export class FindPaginationDto {
    @ApiProperty({ description: '角色名称', type: String, required: false })
    name: string;

    @ApiProperty({ description: '状态（0禁用/1启用）', type: Number, required: false })
    status: number;

    @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
    current?: string;

    @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
    pageSize?: string;
}

export class CSYSRoleDto {
    @ApiProperty({ description: '角色名称', type: String })
    name: string;

    @ApiProperty({ description: '备注', type: String, required: false })
    remark: string;

    @ApiProperty({ description: '状态（0禁用/1启用）', type: Number, required: false })
    status: number;

    @ApiProperty({ description: '排序', type: Number, required: false })
    sort: number;

    @ApiProperty({ description: '菜单Id集合', type: [Number], required: false })
    menus?: [number];

    @ApiProperty({ description: '数据权限范围类型（0全部 1本组织 2本部门及下级部门 3本部门 4自定义）', type: String })
    dataScopeType: string;

    @ApiProperty({ description: '组织Id集合（数据权限为4时必填）', type: [Number], required: false })
    orgs?: [number];
}

export class ESYSRoleDto {
    @ApiProperty({ description: '角色名称', type: String })
    name: string;

    @ApiProperty({ description: '备注', type: String, required: false })
    remark: string;

    @ApiProperty({ description: '状态（0禁用/1启用）', type: Number, required: false })
    status: number;

    @ApiProperty({ description: '排序', type: Number, required: false })
    sort: number;

    @ApiProperty({ description: '菜单Id集合', type: [Number], required: false })
    menus?: [number];

    @ApiProperty({ description: '数据权限范围类型（0全部 1本组织 2本部门及下级部门 3本部门 4自定义）', type: String })
    dataScopeType: string;

    @ApiProperty({ description: '组织Id集合（数据权限为4时必填）', type: [Number], required: false })
    orgs?: [number];
}

