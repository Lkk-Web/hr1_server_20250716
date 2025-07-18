import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { SYSRole } from './SYSRole.model'
import { SYSMenu } from './SYSMenu.model'
import { User, SYSOrg } from '..'

// 角色权限表
@Table({ tableName: `sys_role_org`, timestamps: false })
export class SYSRoleOrg extends Model<SYSRoleOrg> {
  @ForeignKey(() => SYSRole)
  @Column({ type: DataType.INTEGER, comment: '角色id' })
  declare roleId: number

  @ForeignKey(() => SYSOrg)
  @Column({ type: DataType.INTEGER, comment: '组织id' })
  declare orgId: number
}
