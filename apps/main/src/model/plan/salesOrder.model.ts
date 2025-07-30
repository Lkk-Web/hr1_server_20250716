import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Customer } from '@model/base/customer.model'
import { SalesOrderDetail } from '@model/plan/salesOrderDetail.model'
import { ProductionOrder } from '@model/production/productionOrder.model'

@Table({ tableName: 'plan_sales_order', freezeTableName: true, timestamps: true, comment: '销售订单表' })
export class SalesOrder extends BaseDate<SalesOrder> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: '订单编号',
  })
  declare code: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '订单日期',
  })
  declare orderDate: Date

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '客户id',
  })
  declare customerId: number

  @Column({
    comment: '单据状态',
    type: DataType.STRING(50),
  })
  declare dataStatus: string

  @Column({
    comment: '单据类型',
    type: DataType.STRING(50),
  })
  declare types: string

  @Default(true)
  @Column({
    comment: '禁用状态（启用/禁用）',
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare status: boolean

  @Column({
    comment: '审核日期',
    type: DataType.DATE,
  })
  declare approveDate: Date | string

  @Column({
    comment: '审核人',
    type: DataType.INTEGER,
  })
  declare approveById: number

  @BelongsTo(() => Customer)
  customer: Customer

  @HasMany(() => ProductionOrder)
  productionOrder: ProductionOrder

  @HasMany(() => SalesOrderDetail)
  details: SalesOrderDetail[]
}
