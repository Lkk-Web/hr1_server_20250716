import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandardDetail } from '@model/em/checkStandardDetail.model'
import { EquipmentLedger } from '@model/em/equipmentLedger.model'
import { CheckOrderDetail } from '@model/em/checkOrderDetail.model'
import { InspectionOrderDetail } from '@model/em/inspectionOrderDetail.model'
import { RepairOrderDetail } from '@model/em/repairOrderDetail.model'
import { RepairOrderResult } from '@model/em/repairOrderResult.model'
import { RepairOrderReceive } from '@model/em/repairOrderReceive.model'

@Table({ tableName: `em_repair_Order`, freezeTableName: true, timestamps: true, comment: '维修单表' })
export class RepairOrder extends BaseDate<RepairOrder> {
  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '维修单号',
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
    type: DataType.STRING(20),
    allowNull: true,
    comment: '维修状态',
  })
  declare status: string

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

  @HasOne(() => RepairOrderDetail)
  detail: RepairOrderDetail

  @HasOne(() => RepairOrderResult)
  result: RepairOrderResult

  @HasOne(() => RepairOrderReceive)
  receive: RepairOrderReceive
}
