import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { CheckStandardDetail } from '@model/equipment/checkStandardDetail.model'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { CheckOrderDetail } from '@model/equipment/checkOrderDetail.model'
import { InspectionOrderDetail } from '@model/equipment/inspectionOrderDetail.model'
import { RepairOrder } from '@model/equipment/repairOrder.model'

@Table({ tableName: `equipment_repair_Order_result`, freezeTableName: true, timestamps: true, comment: '维修单维修结果表' })
export class RepairOrderResult extends BaseDate<RepairOrderResult> {
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
    comment: '是否进行维修',
  })
  declare isRepair: boolean

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '作废原因',
  })
  declare cancelReason: string

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
    comment: '故障类别',
  })
  declare type: string

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '故障原因',
  })
  declare faultReason: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '维修情况说明',
  })
  declare explain: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '维修开始时间',
  })
  declare startAt: Date

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '维修结束时间',
  })
  declare endAt: Date

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '维修人Id',
  })
  declare repairUserId: number

  @BelongsTo(() => RepairOrder, { foreignKey: 'repairOrderId', constraints: false, foreignKeyConstraint: false })
  repairOrder: RepairOrder

  @BelongsTo(() => User, { foreignKey: 'repairUserId', constraints: false, foreignKeyConstraint: false })
  repairUser: User
}
