import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/wm/warehouse.model'
import { User } from '@model/sys/user.model'
import { InboundOrderDetail } from '@model/wm/inboundOrderDetail.model'
import { OutboundOrderDetail } from '@model/wm/outboundOrderDetail.model'
import { AdjustOrderDetail } from '@model/wm/adjustOrderDetail.model'

@Table({ tableName: `wm_adjust_order`, freezeTableName: true, timestamps: true, comment: '盘点单表' })
export class AdjustOrder extends BaseDate<AdjustOrder> {
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '盘点单号',
  })
  declare code: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '盘点类型(期初盘点,期末盘点,存货调整)',
  })
  declare type: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '盘点开始时间',
  })
  declare startTime: Date

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '盘点结束时间',
  })
  declare endTime: Date

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '仓库Id',
  })
  declare warehouseId: number

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
  })
  declare remark: string

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: '待审核',
    comment: '单据状态',
  })
  declare status: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '审核人Id',
  })
  declare auditorId: number

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '审核时间',
  })
  declare auditedAt: Date

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

  @BelongsTo(() => Warehouse)
  warehouse: Warehouse

  @BelongsTo(() => User, 'auditorId')
  auditor: User

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => AdjustOrderDetail)
  details: AdjustOrderDetail[]
}
