import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user.model'
import { WorkShop } from '@model/base/workShop.model'
import { PRODetail } from '@model/warehouse/PRODetail.model'

@Table({ tableName: `warehouse_pro`, freezeTableName: true, timestamps: true, comment: '生产入库单' })
export class PRO extends BaseDate<PRO> {
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '入库单号',
  })
  declare code: string

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
    allowNull: true,
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
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '源单类型',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare originType: string

  @HasMany(() => PRODetail)
  detail: PRODetail

  @BelongsTo(() => Warehouse)
  warehouse: Warehouse

  @BelongsTo(() => User)
  keeper: User

  @BelongsTo(() => WorkShop)
  workShop: WorkShop
}
