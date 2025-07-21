import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { CheckStandardDetail } from '@model/equipment/checkStandardDetail.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { CheckOrderDetail } from '@model/equipment/checkOrderDetail.model'
import { InspectionOrderDetail } from '@model/equipment/inspectionOrderDetail.model'
import { RepairOrder } from '@model/equipment/repairOrder.model'

@Table({ tableName: `equipment_repair_Order_receive`, freezeTableName: true, timestamps: true, comment: '维修单结果验收表' })
export class RepairOrderReceive extends BaseDate<RepairOrderReceive> {
  @ForeignKey(() => RepairOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '维修单Id',
  })
  declare repairOrderId: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    comment: '是否修复',
  })
  declare isRepaired: boolean

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '设备状态',
  })
  declare status: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '维修评分',
  })
  declare score: number

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '维修评价',
  })
  declare evaluate: string
}
