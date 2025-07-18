import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandardDetail } from '@model/em/checkStandardDetail.model'
import { EquipmentLedger } from '@model/em/equipmentLedger.model'
import { CheckOrderDetail } from '@model/em/checkOrderDetail.model'
import { InspectionOrderDetail } from '@model/em/inspectionOrderDetail.model'
import { RepairOrder } from '@model/em/repairOrder.model'

@Table({ tableName: `em_repair_Order_detail`, freezeTableName: true, timestamps: true, comment: '维修单报修明细表' })
export class RepairOrderDetail extends BaseDate<RepairOrderDetail> {
  @ForeignKey(() => RepairOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '维修单Id',
  })
  declare repairOrderId: number

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: '故障描述',
  })
  declare description: string

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '故障拍照',
  })
  declare images: string[]

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '故障视频',
  })
  declare videos: string[]

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '报修时间',
  })
  declare repairDate: Date

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '报修人',
  })
  declare reportUserId: number

  @BelongsTo(()=>RepairOrder,{ foreignKey: 'repairOrderId', constraints: false, foreignKeyConstraint: false })
  repairOrder : RepairOrder

  @BelongsTo(() => User)
  reportUser: User
}
