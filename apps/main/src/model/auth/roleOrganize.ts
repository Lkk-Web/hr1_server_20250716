import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { Role } from './role'
import { Menu } from './menu'
import { User, Organize } from '..'

// 角色权限表
@Table({ tableName: `auth_role_organize`, timestamps: false })
export class RoleOrganize extends Model<RoleOrganize> {
  @ForeignKey(() => Role)
  @Column({ type: DataType.INTEGER, comment: '角色id' })
  declare roleId: number

  @ForeignKey(() => Organize)
  @Column({ type: DataType.INTEGER, comment: '组织id' })
  declare orgId: number
}
