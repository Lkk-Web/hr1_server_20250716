import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/auth/user'
import { InboundOrderDetail } from '@model/warehouse/inboundOrderDetail.model'
import { OutboundOrderDetail } from '@model/warehouse/outboundOrderDetail.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { MaterialRequisitionDetail } from '@model/warehouse/materialRequisitionDetail.model'

@Table({ tableName: `warehouse_material_requisition`, freezeTableName: true, timestamps: true, comment: '生产领料单' })
export class MaterialRequisition extends BaseDate<MaterialRequisition> {
  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '领料单号',
  })
  declare code: string

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '领料时间',
  })
  declare requisitionAt: Date

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
    comment: '领料人Id',
  })
  declare pickerId: number

  //工单ID
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '工单id',
    type: DataType.STRING(255),
    allowNull: true, // 必填项
  })
  declare productionOrderId: string

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

  @BelongsTo(() => ProductionOrder)
  productionOrder: ProductionOrder

  @BelongsTo(() => Warehouse)
  warehouse: Warehouse

  @BelongsTo(() => User, 'auditorId')
  auditor: User

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => MaterialRequisitionDetail)
  details: MaterialRequisitionDetail[]
}
