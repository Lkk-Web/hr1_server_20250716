import { Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `auth_menu`, timestamps: true, freezeTableName: true, paranoid: false })
export class Menu extends BaseDate<Menu> {
  @Column({ type: DataType.STRING, comment: '菜单编号' })
  declare code: string

  @Column({ type: DataType.STRING, comment: '菜单名称' })
  declare name: string

  @ForeignKey(() => Menu)
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

  @HasMany(() => Menu)
  declare childMenus: Menu[]

  // methods
  // ------------------------------------------------
  static findPagination = findPagination
}
