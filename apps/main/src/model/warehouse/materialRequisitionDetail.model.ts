import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Supplier } from '@model/base/supplier.model'
import { Customer } from '@model/base/customer.model'
import { Warehouse } from '@model/warehouse/warehouse.model'
import { User } from '@model/sys/user.model'
import { InboundOrder } from '@model/warehouse/inboundOrder.model'
import { Material } from '@model/base/material.model'
import { OutboundOrder } from '@model/warehouse/outboundOrder.model'
import { MaterialRequisition } from '@model/warehouse/materialRequisition.model'

@Table({ tableName: `warehouse_material_requisition_detail`, freezeTableName: true, timestamps: true, comment: '领料单明细表' })
export class MaterialRequisitionDetail extends BaseDate<MaterialRequisitionDetail> {
  @ForeignKey(() => MaterialRequisition)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '领料单Id',
  })
  declare materialRequisitionId: number

  @ForeignKey(() => Material)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '物料Id',
  })
  declare materialId: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '领用数量',
  })
  declare count: number

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '批次号',
  })
  declare batNum: string

  @BelongsTo(() => Material)
  material: Material
}
