import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
/** 车间 */
@Table({ tableName: `base_workshop`, freezeTableName: true, timestamps: true, comment: '车间表' })
export class WorkShop extends BaseDate<WorkShop> {
  // 车间名称：必填
  @Column({
    comment: '车间名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  @ForeignKey(() => User)
  // 负责人
  @Column({
    comment: '负责人',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare chargeId: number

  // 状态
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false, // 可选
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @BelongsTo(() => User)
  charge: User
}
