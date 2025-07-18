import { AutoIncrement, BelongsTo, Column, CreatedAt, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript'
import { findPagination } from '@model/shared/method'
import { BaseDate } from '@model/shared/baseDate'
/**系统对接字典表 */
@Table({ tableName: `sys_api_dict`, timestamps: false, freezeTableName: true, comment: '系统对接字典表' })
export class ApiDict extends BaseDate<ApiDict> {
  @Column({ type: DataType.STRING, comment: '对接系统' })
  declare xtName: string

  @Column({ type: DataType.STRING, comment: '字典名称' })
  declare name: string

  @Column({ type: DataType.STRING, comment: '对应id' })
  declare fid: string

  @Column({ type: DataType.STRING, comment: '对应编码' })
  declare code: string

  @Column({ type: DataType.STRING, comment: '对应内容' })
  declare content: string

  @Column({ type: DataType.STRING, comment: '扩展内容1' })
  declare content1: string

  @Column({ type: DataType.STRING, comment: '扩展内容2' })
  declare content2: string
  // methods
  // ------------------------------------------------
  static findPagination = findPagination
}
