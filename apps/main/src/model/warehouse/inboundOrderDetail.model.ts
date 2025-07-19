import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user.model'
import { InboundOrder } from '@model/warehouse/inboundOrder.model'
import { Material } from '@model/base/material.model'

@Table({ tableName: `warehouse_inbound_order_detail`, freezeTableName: true, timestamps: true, comment: '入库单明细表' })
export class InboundOrderDetail extends BaseDate<InboundOrderDetail> {
  @ForeignKey(() => InboundOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '入库单Id',
  })
  declare inboundOrderId: number

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
    comment: '入库数量',
  })
  declare count: number

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '批次号',
  })
  declare batNum: string

  @BelongsTo(() => Material)
  material: Material
}
