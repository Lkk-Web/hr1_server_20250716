import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/wm/warehouse.model'
import { User } from '@model/sys/user.model'
import { InboundOrder } from '@model/wm/inboundOrder.model'
import { Material } from '@model/base/material.model'
import { AdjustOrder } from '@model/wm/adjustOrder.model'

@Table({ tableName: `wm_adjust_order_detail`, freezeTableName: true, timestamps: true, comment: '调整单明细表' })
export class AdjustOrderDetail extends BaseDate<AdjustOrderDetail> {
  @ForeignKey(() => AdjustOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '调整单Id',
  })
  declare adjustOrderId: number

  @ForeignKey(() => Material)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '物料Id',
  })
  declare materialId: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '当前数量',
  })
  declare currentCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '实际数量',
  })
  declare count: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '盘盈数量',
  })
  declare profitCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '盘盈数量',
  })
  declare lossCount: number

  @BelongsTo(() => Material)
  material: Material
}
