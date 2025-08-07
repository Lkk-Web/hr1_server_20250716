import { BelongsToMany, Column, DataType, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Menu } from './menu'
import { RoleMenu } from './roleMenu'
import { Organize } from './organize'
import { RoleOrganize } from './roleOrganize'
import { ROLE_CODE } from '@common/enum'

@Table({ tableName: `auth_role`, timestamps: true, freezeTableName: true, paranoid: true })
export class Role extends BaseDate<Role> {
  @Column({ type: DataType.ENUM(...Object.values(ROLE_CODE)), comment: '角色编号', allowNull: false, defaultValue: ROLE_CODE.USER })
  declare code: ROLE_CODE

  @Column({ type: DataType.STRING, comment: '角色名称' })
  declare name: string

  @Column({ type: DataType.STRING, comment: '备注' })
  declare remark: string

  @Column({ type: DataType.INTEGER, comment: '排序' })
  declare sort: number

  @Column({ type: DataType.INTEGER, comment: '状态（0禁用/1启用）', defaultValue: 1 })
  declare status: number

  @Column({ type: DataType.STRING, comment: '组织编号' })
  declare orgCode: string

  @Column({ type: DataType.DATE, comment: '创建时间', defaultValue: DataType.NOW })
  declare createdAt: Date

  @Column({ type: DataType.DATE, comment: '更新时间', defaultValue: DataType.NOW })
  declare updatedAt: Date

  @Column({ type: DataType.STRING, comment: '数据权限范围类型（0全部 1本组织 2本部门及下级部门 3本部门 4自定义）' })
  declare dataScopeType: string

  @BelongsToMany(() => Menu, { through: () => RoleMenu, uniqueKey: 'Role_rm_menu_unique', foreignKey: 'roleId', otherKey: 'menuId' })
  declare menuList: Menu[]

  @BelongsToMany(() => Organize, { through: () => RoleOrganize, uniqueKey: 'SYSRole_ro_org_unique', foreignKey: 'roleId', otherKey: 'orgId' })
  declare orgList: Organize[]

  //是否配置权限
  declare type: string

  // 角色权限
  declare permissions: any
}
