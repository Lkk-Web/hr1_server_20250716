import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript'
import { SYSRole } from './SYSRole.model'
import { SYSMenu } from './SYSMenu.model'

@Table({ tableName: `sys_role_menu`, timestamps: false, freezeTableName: true, paranoid: true })
export class SYSRoleMenu extends Model<SYSRoleMenu> {
  @ForeignKey(() => SYSRole)
  @Column({ type: DataType.INTEGER, comment: '角色id' })
  declare roleId: number

  @ForeignKey(() => SYSMenu)
  @Column({ type: DataType.INTEGER, comment: '菜单id' })
  declare menuId: number
}
