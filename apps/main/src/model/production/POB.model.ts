import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { BOM } from '@model/base/bom.model'
import { POBDetail } from '@model/production/POBDetail.model'
import { ProductionOrderDetail } from './productionOrderDetail.model'

@Table({ tableName: `production_POB`, freezeTableName: true, timestamps: true, comment: '生产工单关联用料清单表' })
export class POB extends BaseDate<POB> {
  @ForeignKey(() => ProductionOrderDetail)
  @Column({
    comment: '工单id',
    type: DataType.STRING(255),
    allowNull: true, // 必填项
  })
  declare productionOrderDetailId: string

  // 数量
  @Column({
    comment: '金蝶编码',
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare kingdeeCode: string

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
    comment: '数量',
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
  })
  declare quantity: number

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

  @BelongsTo(() => ProductionOrderDetail)
  order: ProductionOrderDetail

  @HasMany(() => POBDetail)
  pobDetail: POBDetail[]
}
