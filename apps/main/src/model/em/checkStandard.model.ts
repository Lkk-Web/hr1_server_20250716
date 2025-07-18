import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandardDetail } from '@model/em/checkStandardDetail.model'

@Table({ tableName: `em_check_standard`, freezeTableName: true, timestamps: true, comment: '点检标准表' })
export class CheckStandard extends BaseDate<CheckStandard> {
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '点检标准编码',
  })
  declare code: string

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '点检标准名称',
  })
  declare name: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    comment: '状态',
    defaultValue: true,
  })
  declare status: boolean

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
  })
  declare remark: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '创建人',
  })
  declare createdUserId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '更新人',
  })
  declare updatedUserId: number

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => CheckStandardDetail)
  details: CheckStandardDetail[]
}
