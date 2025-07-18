import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandardDetail } from '@model/equipment/checkStandardDetail.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { CheckOrderDetail } from '@model/equipment/checkOrderDetail.model'
import { InspectionOrderDetail } from '@model/equipment/inspectionOrderDetail.model'

@Table({ tableName: `equipment_inspection_Order`, freezeTableName: true, timestamps: true, comment: '巡检单表' })
export class InspectionOrder extends BaseDate<InspectionOrder> {
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '巡检单号',
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
    comment: '巡检时间',
  })
  declare checkAt: Date

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '巡检员Id',
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
    comment: '巡检结果',
  })
  declare result: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '当日第几次巡检',
  })
  declare count: number

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '巡检总结',
  })
  declare summary: string

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
  equipmentLedger: EquipmentLedger

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @BelongsTo(() => User, 'checkUserId')
  checkUser: User

  @HasMany(() => InspectionOrderDetail)
  details: InspectionOrderDetail[]
}
