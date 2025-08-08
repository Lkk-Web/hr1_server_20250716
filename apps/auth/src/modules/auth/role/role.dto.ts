import { IsEnum, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Role } from '@model/auth/role'
import { DATA_SCOPE_TYPE } from '@common/constant'
import { ROLE_CODE } from '@common/enum'

export class FindPaginationDto {
  @ApiProperty({ description: '角色名称', type: String, required: false })
  name: string

  @ApiProperty({ description: '状态（0禁用/1启用）', type: Number, required: false })
  status: number

  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string

  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string

  @ApiProperty({ description: '备注', type: String, required: false })
  remark?: string

  @ApiProperty({ description: '数据权限范围类型（0全部 1本组织 2本部门及下级部门 3本部门 4自定义）', type: String, required: false })
  dataScopeType?: string
}

export class RoleCreateDto {
  @ApiProperty({ description: '角色名称', type: String })
  name: string

  @ApiProperty({ description: '备注', type: String, required: false })
  remark: string

  @ApiProperty({ description: '状态（0禁用/1启用）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '排序', type: Number, required: false })
  sort: number

  @ApiProperty({ description: '菜单Id集合', type: [Number], required: false })
  menus?: [number]

  @ApiProperty({ name: 'code', required: false, description: '角色编码', enum: ROLE_CODE })
  @IsEnum(ROLE_CODE, { message: '无效的角色编码' })
  code: ROLE_CODE

  @ApiProperty({ description: '数据权限范围类型（0全部 1本组织 2本部门及下级部门 3本部门 4自定义）', type: String })
  dataScopeType: string

  @ApiProperty({ description: '组织Id集合（数据权限为4时必填）', type: [Number], required: false })
  orgs?: [number]
}

export class RoleEditDto {
  @ApiProperty({ description: '角色名称', type: String })
  name: string

  @ApiProperty({ description: '备注', type: String, required: false })
  remark: string

  @ApiProperty({ description: '状态（0禁用/1启用）', type: Number, required: false })
  status: number

  @ApiProperty({ description: '排序', type: Number, required: false })
  sort: number

  @ApiProperty({ description: '菜单Id集合', type: [Number], required: false })
  menus?: [number]

  @ApiProperty({ name: 'code', required: false, description: '角色编码', enum: ROLE_CODE })
  @IsEnum(ROLE_CODE, { message: '无效的角色编码' })
  code: ROLE_CODE

  @ApiProperty({ description: '数据权限范围类型（0全部 1本组织 2本部门及下级部门 3本部门 4自定义）', type: String })
  dataScopeType: string

  @ApiProperty({ description: '组织Id集合（数据权限为4时必填）', type: [Number], required: false })
  orgs?: [number]
}

class MenuPower {
  @ApiProperty({ description: '菜单id', type: Number })
  menuId: number

  @ApiProperty({ description: '操作编号', type: [String] })
  code: [string]

  @ApiProperty({ description: '状态 0/1', type: Number, required: false })
  status: number

  @ApiProperty({
    description: '数据权限范围类型 全部/本部门/仅本人/自定义',
    type: Number,
    enum: Object.values(DATA_SCOPE_TYPE),
  })
  dataScopeType: DATA_SCOPE_TYPE

  @ApiProperty({ description: '部门ID', type: [Number] })
  depts: number[]
}

export class RoleMenuPowerDto {
  @ApiProperty({ description: '数组对象', type: [MenuPower] })
  arr: MenuPower[]
}
