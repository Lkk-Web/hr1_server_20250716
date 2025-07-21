import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'

@Table({ tableName: `system_business_log` })
export class SystemBusinessLog extends BaseDate<SystemBusinessLog> {
  @Column({
    type: DataType.STRING,
    comment: '操作描述',
  })
  declare description: string

  @Column({
    type: DataType.STRING,
    comment: '操作模块',
  })
  declare module: string

  @Column({
    type: DataType.STRING,
    comment: '组织code',
  })
  declare orgCode: string

  @ForeignKey(() => User) // Replace [AnotherModel] with the actual model class
  @Column({
    type: DataType.INTEGER,
    comment: '用户id',
  })
  declare userId: number

  @Column({
    type: DataType.STRING,
    comment: '操作行为',
  })
  declare behavioral: string

  @Column({
    type: DataType.STRING,
    comment: '参数',
  })
  declare params: string

  @Column({
    type: DataType.DATE,
    comment: '创建时间',
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date

  @Column({
    type: DataType.DATE,
    comment: '更新时间',
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date

  @Column({
    type: DataType.STRING,
    comment: 'IP地址',
  })
  declare ip: string

  @BelongsTo(() => User)
  user: User
}
