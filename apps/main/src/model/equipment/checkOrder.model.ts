import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { CheckOrderDetail } from '@model/equipment/checkOrderDetail.model'

@Table({ tableName: `equipment_check_order`, freezeTableName: true, timestamps: true, comment: '点检单表' })
export class CheckOrder extends BaseDate<CheckOrder> {
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '点检单号',
  })
  declare code: string

  @ForeignKey(() => EquipmentLedger)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '设备台账Id',
  })
  declare equipmentLedgerId: number

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '点检时间',
  })
  declare checkAt: Date

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '点检员Id',
  })
  declare checkUserId: number

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '设备状态',
  })
  declare status: string

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '点检结果',
  })
  declare result: string

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

  @BelongsTo(() => EquipmentLedger)
  declare equipmentLedger: EquipmentLedger

  @BelongsTo(() => User, 'createdUserId')
  declare createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  declare updatedUser: User

  @BelongsTo(() => User, 'checkUserId')
  declare checkUser: User

  @HasMany(() => CheckOrderDetail)
  declare details: CheckOrderDetail[]
}
