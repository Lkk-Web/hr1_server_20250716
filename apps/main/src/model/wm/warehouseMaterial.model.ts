import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Warehouse } from '@model/wm/warehouse.model'
import { Material } from '@model/base/material.model'

/** 仓库物料关联表 */
@Table({
  tableName: `wm_warehouse_material`,
  freezeTableName: true,
  timestamps: true,
  comment: '仓库物料关联表',
})
export class WarehouseMaterial extends BaseDate<WarehouseMaterial> {
  // 仓库Id
  @ForeignKey(() => Warehouse)
  @Column({
    comment: '仓库Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare warehouseId: number

  // 仓库Id
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare materialId: number

  @Column({
    comment: '仓库数量',
    type: DataType.DECIMAL(10, 2),
    allowNull: false, // 必填
  })
  declare count: number

  @BelongsTo(() => Material)
  material: Material
}
