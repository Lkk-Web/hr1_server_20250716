import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user'
import { InboundOrder } from '@model/warehouse/inboundOrder.model'
import { Material } from '@model/base/material.model'
import { TransferOrder } from '@model/warehouse/transferOrder.model'

@Table({ tableName: `warehouse_transfer_order_detail`, freezeTableName: true, timestamps: true, comment: '调拨单明细表' })
export class TransferOrderDetail extends BaseDate<TransferOrderDetail> {
  @ForeignKey(() => TransferOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '调拨单Id',
  })
  declare transferOrderId: number

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
    comment: '调拨数量',
  })
  declare count: number

  @BelongsTo(() => Material)
  material: Material
}
