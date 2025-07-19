import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user.model'
import { InboundOrder } from '@model/warehouse/inboundOrder.model'
import { Material } from '@model/base/material.model'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'

@Table({ tableName: `warehouse_outbound_order_detail`, freezeTableName: true, timestamps: true, comment: '出库单明细表' })
export class OutboundOrderDetail extends BaseDate<OutboundOrderDetail> {
  @ForeignKey(() => OutboundOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '出库单Id',
  })
  declare outboundOrderId: number

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
    comment: '出库数量',
  })
  declare count: number

  declare accrueOutCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单数量',
    defaultValue: 0,
  })
  declare quantity: number

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '批次号',
  })
  declare batNum: string

  @BelongsTo(() => Material)
  material: Material
}
