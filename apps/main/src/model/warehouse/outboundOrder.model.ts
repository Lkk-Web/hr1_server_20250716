import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user.model'
import { InboundOrderDetail } from '@model/warehouse/inboundOrderDetail.model'
import { OutboundOrderDetail } from '@model/warehouse/outboundOrderDetail.model'

@Table({ tableName: `warehouse_outbound_order`, freezeTableName: true, timestamps: true, comment: '出库单表' })
export class OutboundOrder extends BaseDate<OutboundOrder> {
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '出库单号',
  })
  declare code: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '出库类型',
  })
  declare type: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '出库时间',
  })
  declare outboundTime: Date

  @ForeignKey(() => Supplier)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '供应商ID',
  })
  declare supplierId: number

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '客户Id',
  })
  declare customerId: number

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

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '来源单据',
  })
  declare originCode: string

  @BelongsTo(() => Supplier)
  supplier: Supplier

  @BelongsTo(() => Customer)
  customer: Customer

  @BelongsTo(() => Warehouse)
  warehouse: Warehouse

  @BelongsTo(() => User, 'auditorId')
  auditor: User

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => OutboundOrderDetail)
  details: OutboundOrderDetail[]
}
