import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { Role } from './role'
import { Menu } from './menu'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `auth_role_menu`, timestamps: false, freezeTableName: true, paranoid: true })
export class RoleMenu extends BaseDate<RoleMenu> {
  @ForeignKey(() => Role)
  @Column({ type: DataType.INTEGER, comment: '角色id' })
  declare roleId: number

  @ForeignKey(() => Menu)
  @Column({ type: DataType.INTEGER, comment: '菜单id' })
  declare menuId: number
}
