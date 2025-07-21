import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user'
import { TransferOrderDetail } from '@model/warehouse/transferOrderDetail.model'

@Table({ tableName: `warehouse_transfer_order`, freezeTableName: true, timestamps: true, comment: '调拨单表' })
export class TransferOrder extends BaseDate<TransferOrder> {
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '调拨单号',
  })
  declare code: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '调拨类型',
  })
  declare type: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '调拨时间',
  })
  declare transferTime: Date

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '调出仓库Id',
  })
  declare outWarehouseId: number

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '调入仓库Id',
  })
  declare intoWarehouseId: number

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

  @BelongsTo(() => Warehouse, 'outWarehouseId')
  outWarehouse: Warehouse

  @BelongsTo(() => Warehouse, 'intoWarehouseId')
  intoWarehouse: Warehouse

  @BelongsTo(() => User, 'auditorId')
  auditor: User

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => TransferOrderDetail)
  details: TransferOrderDetail[]
}
