import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
@Table({ tableName: `warehouse_flow`, freezeTableName: true, timestamps: true, comment: '库存流水表' })
export class Flow extends BaseDate<Flow> {
  @ForeignKey(() => Material)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '产品Id',
  })
  declare materialId: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '单据数量',
  })
  declare documentQuantity: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '库存变更数量',
  })
  declare changeQuantity: number

  @ForeignKey(() => Supplier)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '供应商Id',
  })
  declare supplierId: number

  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '客户Id',
  })
  declare customerId: number

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '单据日期',
  })
  declare documentDate: Date

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '单据类型（销售出库/采购入库）',
  })
  declare documentType: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '单据编号',
  })
  declare documentCode: string

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '仓库Id',
  })
  declare warehouseId: number

  @BelongsTo(() => Material)
  material: Material

  @BelongsTo(() => Supplier)
  supplier: Supplier

  @BelongsTo(() => Customer)
  customer: Customer

  @BelongsTo(() => Warehouse)
  warehouse: Warehouse
}
