import { BelongsToMany, Column, DataType, Table } from 'sequelize-typescript'
import { SYSMenu } from './SYSMenu.model'
import { SYSRoleMenu } from './SYSRoleMenu.model'
import { DATA_SCOPE_TYPE } from '@common/constant'
import { SYSOrg } from './SYSOrg.model'
import { SYSRoleOrg } from './SYSRoleOrg.model'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `sys_role`, timestamps: true, freezeTableName: true, paranoid: true })
export class SYSRole extends BaseDate<SYSRole> {
  @Column({ type: DataType.STRING, comment: '角色编号' })
  declare code: string

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

  @BelongsToMany(() => SYSMenu, { through: () => SYSRoleMenu, uniqueKey: 'SYSRole_rm_menu_unique', foreignKey: 'roleId', otherKey: 'menuId' })
  declare menuList: SYSMenu[]

  @BelongsToMany(() => SYSOrg, { through: () => SYSRoleOrg, uniqueKey: 'SYSRole_ro_org_unique', foreignKey: 'roleId', otherKey: 'orgId' })
  declare orgList: SYSOrg[]

  //是否配置权限
  declare type: string

  // 角色权限
  declare permissions: any
}
