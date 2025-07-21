import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'

@Table({ tableName: `equipment_scarp_Order`, freezeTableName: true, timestamps: true, comment: '报废单表' })
export class ScrapOrder extends BaseDate<ScrapOrder> {
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '报废单号',
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
    comment: '报废时间',
  })
  declare scrapAt: Date

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '设备状态',
  })
  declare equipStatus: string

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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '报废人',
  })
  declare scrapUserId: number

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '报废原因',
  })
  declare reason: string

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: '待审核',
    comment: '单据状态',
  })
  declare status: string

  @BelongsTo(() => EquipmentLedger)
  equipmentLedger: EquipmentLedger

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @BelongsTo(() => User, 'scrapUserId')
  scrapUser: User
}
