import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material, Process, ProductionOrder, Organize, User } from '..'

/** 中台通知 */
@Table({ tableName: `center_dc_notify`, freezeTableName: true, timestamps: true, comment: '中台通知' })
export class DCNotify extends BaseDate<DCNotify> {
  @Column({
    comment: '事项',
    type: DataType.STRING,
    allowNull: false,
  })
  action: string

  @Column({
    comment: '数据',
    type: DataType.STRING,
    allowNull: false,
  })
  content: string

  @Column({
    comment: '是否执行',
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  isDone: boolean
}
