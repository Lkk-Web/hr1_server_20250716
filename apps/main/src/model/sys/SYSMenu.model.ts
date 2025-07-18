import { AutoIncrement, BelongsTo, Column, CreatedAt, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'
import { SYSRoleMenu } from './SYSRoleMenu.model'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `sys_menu`, timestamps: true, freezeTableName: true, paranoid: false })
export class SYSMenu extends BaseDate<SYSMenu> {
  @Column({ type: DataType.STRING, comment: '菜单编号' })
  declare code: string

  @Column({ type: DataType.STRING, comment: '菜单名称' })
  declare name: string

  @ForeignKey(() => SYSMenu)
  @Column({ type: DataType.INTEGER, comment: '父级id' })
  declare parentId: number

  @Column({ type: DataType.STRING, comment: '菜单url' })
  declare url: string

  @Column({ type: DataType.STRING, comment: '图标' })
  declare icon: string

  @Column({ type: DataType.STRING, comment: '权限标识' })
  declare perms: string

  @Column({ type: DataType.INTEGER, comment: '排序' })
  declare sort: number

  @Column({ type: DataType.INTEGER, comment: '状态（0隐藏 1显示 ）' })
  declare status: number

  @Column({ type: DataType.STRING, comment: '菜单类型（M目录 C菜单 F按钮）' })
  declare types: string

  @HasMany(() => SYSMenu)
  declare childMenus: SYSMenu[]

  // methods
  // ------------------------------------------------
  static findPagination = findPagination
}
