import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { SalesOrder } from '@model/plan/salesOrder.model'
import { StrBaseModel } from '@model/shared/strBase.model'
import { ProductionOrderDetail } from './productionOrderDetail.model'

@Table({ tableName: `production_order`, freezeTableName: true, timestamps: true, comment: '生产订单表' })
export class ProductionOrder extends StrBaseModel<ProductionOrder> {
  @Column({
    comment: '金蝶编号',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare kingdeeCode: string

  @Column({
    comment: '单据日期',
    type: DataType.DATE,
  })
  declare orderDate: Date

  @ForeignKey(() => SalesOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '销售订单Id',
  })
  declare salesOrderId: number

  // 状态
  @Column({
    comment: '单据状态',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
  })
  declare status: string

  // 优先级
  @Column({
    comment: '优先级 (加急, 暂停, 无)',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
    defaultValue: '无',
  })
  declare priority: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '单据类型',
    type: DataType.STRING,
  })
  declare billType: string

  @BelongsTo(() => SalesOrder)
  declare salesOrder: SalesOrder

  @HasMany(() => ProductionOrderDetail)
  declare productionOrderDetail: ProductionOrderDetail[]
}
