import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { MaintenanceOrderDetail } from '@model/equipment/maintenanceOrderDetail.model'

@Table({ tableName: `equipment_maintenance_order`, freezeTableName: true, timestamps: true, comment: '保养单表' })
export class MaintenanceOrder extends BaseDate<MaintenanceOrder> {
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '保养单号',
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
    comment: '保养时间',
  })
  declare maintenanceAt: Date

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '保养员Id',
  })
  declare maintenanceUserId: number

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '保养结果',
  })
  declare result: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '下次保养时间',
  })
  declare nextAt: Date

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

  @BelongsTo(() => User, 'maintenanceUserId')
  declare maintenanceUser: User

  @HasMany(() => MaintenanceOrderDetail)
  declare details: MaintenanceOrderDetail[]
}
