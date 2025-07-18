import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'

@Table({ tableName: `dm_file_menu`, timestamps: true, paranoid: true })
export class FileMenu extends BaseDate<FileMenu> {
  @Column({ type: DataType.STRING, comment: '类型名称' })
  declare name: string

  @ForeignKey(() => FileMenu)
  @Column({ type: DataType.INTEGER, comment: '父级id' })
  declare parentId: number

  @Column({ type: DataType.INTEGER, comment: '排序' })
  declare sort: number

  @Column({ type: DataType.INTEGER, comment: '状态 0/1（0显示 1隐藏）' })
  declare status: number

  @Column({ type: DataType.INTEGER, comment: '类型：0其它 1、ESOP' })
  declare types: number

  @HasMany(() => FileMenu)
  declare children: FileMenu[]

  declare count: number
}
