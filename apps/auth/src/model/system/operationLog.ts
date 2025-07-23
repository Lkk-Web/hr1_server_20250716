import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { request_Method } from '@common/enum'

@Table({ tableName: `system_operation_log` })
export class SystemOperationLog extends BaseDate<SystemOperationLog> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    comment: '用户id',
  })
  declare userId: number

  @Column({
    type: DataType.ENUM(...Object.values(request_Method)),
    comment: '操作行为',
  })
  declare behavioral: request_Method

  @Column({
    type: DataType.STRING,
    comment: '请求路径',
  })
  declare url: string

  @Column({
    type: DataType.TEXT,
    comment: '查询参数',
  })
  declare query: string

  @Column({
    type: DataType.TEXT,
    comment: '路由参数',
  })
  declare params: string

  @Column({
    type: DataType.TEXT,
    comment: '请求参数',
  })
  declare body: string

  @Column({
    type: DataType.STRING,
    comment: 'IP地址',
  })
  declare ip: string

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

  @BelongsTo(() => User)
  user: User
}
