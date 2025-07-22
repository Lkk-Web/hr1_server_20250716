import { Model, Column, DataType, Table, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { Customer } from '@model/base/customer.model'
import { User } from '@model/auth/user'
import { EquipmentLedger } from '@model/equipment/equipmentLedger.model'
import { SalesOrder } from '@model/plan/salesOrder.model'

@Table({ tableName: 'plan_sales_order_detail', freezeTableName: true, timestamps: true, comment: '销售订单明细表' })
export class SalesOrderDetail extends BaseDate<SalesOrderDetail> {
  @ForeignKey(() => SalesOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '销售订单Id',
  })
  declare salesOrderId: number

  @ForeignKey(() => Material)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '物料ID',
  })
  declare materialId: number

  @ForeignKey(() => Material)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Bom ID',
  })
  declare bomId: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '单价',
  })
  declare unitPrice: number

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '单位',
  })
  declare unit: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '数量',
  })
  declare quantity: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '金额',
  })
  declare amount: number

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '即时库存',
  })
  declare oraQty: number

  @Column({
    comment: '国标图号',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare k3StandardDrawingNo: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '要货日期',
  })
  declare deliveryDate: Date

  @BelongsTo(() => Material)
  material: Material

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: '物料编码',
  })
  declare materialCode: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: '物料名称',
  })
  declare materialName: string
}
