import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Supplier } from '@model/base/supplier.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/sys/user.model'
import { WorkShop } from '@model/base/workShop.model'
import { ExportOrderDetail } from '@model/warehouse/exportOrderDetail.model'
import { StrBaseModel } from '@model/shared/strBase.model'

@Table({ tableName: `warehouse_export_order`, freezeTableName: true, timestamps: true, comment: '出入库单' })
export class ExportOrder extends StrBaseModel<ExportOrder> {
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '入库单号',
  })
  declare code: string

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '单据类型',
  })
  declare docType: string

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '仓库Id',
  })
  declare warehouseId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '仓管员Id',
  })
  declare keeperId: number

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '单据日期',
  })
  declare date: Date

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '单据类型',
  })
  declare type: string

  @ForeignKey(() => WorkShop)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '车间Id',
  })
  declare workShopId: number

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '单据状态',
    defaultValue: '暂存',
  })
  declare status: string

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'ERP生产订单号',
  })
  declare ERPCode: string

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '业务状态',
    defaultValue: '待收货',
  })
  declare businessStatus: string

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '拍照',
  })
  declare images: string[]

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @ForeignKey(() => Supplier)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '供应商Id',
  })
  declare supplierId: number

  @Column({
    comment: '源单类型',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare originType: string

  @BelongsTo(() => Supplier)
  supplier: Supplier

  @HasMany(() => ExportOrderDetail)
  detail: ExportOrderDetail[]

  @BelongsTo(() => Warehouse)
  warehouse: Warehouse

  @BelongsTo(() => User)
  keeper: User

  @BelongsTo(() => WorkShop)
  workShop: WorkShop
}
