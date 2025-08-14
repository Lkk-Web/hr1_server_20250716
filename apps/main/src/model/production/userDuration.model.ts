import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { User } from '@model/auth/user'
import { BaseModel } from '@model/shared/base.model'

@Table({ tableName: `production_user_duration`, timestamps: true, updatedAt: false, comment: '生产报工员工时长' })
export class UserDuration extends BaseModel<UserDuration> {
  @ForeignKey(() => User)
  @Column({
    comment: '用户id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number

  @Column({
    comment: '所用时长 单位/s',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare duration: number

  @CreatedAt
  @Column
  declare createdAt?: Date

  @BelongsTo(() => User)
  declare user: User
}
