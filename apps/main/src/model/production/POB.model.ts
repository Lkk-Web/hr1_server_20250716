import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { Material } from '@model/base/material.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { BOM } from '@model/base/bom.model'
import { POBD } from '@model/production/POBD.model'

@Table({ tableName: `production_POB`, freezeTableName: true, timestamps: true, comment: '生产工单关联用料清单表' })
export class POB extends BaseDate<POB> {
  //工单ID
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '工单id',
    type: DataType.STRING(255),
    allowNull: true, // 必填项
  })
  declare productionOrderId: string

  // 数量
  @Column({
    comment: '单据编号',
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare code: string

  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  @ForeignKey(() => BOM)
  @Column({
    comment: 'bomId',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare bomId: number

  // 数量
  @Column({
    comment: '辅助属性',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare fz: number

  // 数量
  @ForeignKey(() => SYSOrg)
  @Column({
    comment: '生产车间Id',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare workShopId: number

  @Column({
    comment: '单位',
    type: DataType.STRING,
    allowNull: true,
  })
  declare unit: string

  // 数量
  @Column({
    comment: '数量',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare count: number

  // 数量
  @Column({
    comment: '生产订单行号',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare orderRowNum: number

  @Column({
    comment: '单据状态',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare status: string

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @BelongsTo(() => Material)
  material: Material

  @BelongsTo(() => ProductionOrder)
  order: ProductionOrder

  @HasMany(() => POBD)
  items: POBD[]
}
