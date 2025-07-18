import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { PRO } from '@model/warehouse/PRO.model'

@Table({ tableName: `warehouse_pro_detail`, freezeTableName: true, timestamps: true, comment: '生产入库单明细表' })
export class PRODetail extends BaseDate<PRODetail> {
  @ForeignKey(() => PRO)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '生产入库单',
  })
  declare proId: number

  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare materialId: number

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '类型',
  })
  declare type: string

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '应收数量',
  })
  declare pendCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '实收数量',
  })
  declare checkedCount: number

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '检验数量',
  })
  declare checkoutCount: number

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '批号',
  })
  declare batNum: string

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '长度',
  })
  declare length: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '入库时间',
  })
  declare date: Date

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '一物一码集合',
  })
  declare itemCodes: string

  @BelongsTo(() => PRO, { foreignKey: 'proId', constraints: false, foreignKeyConstraint: false })
  pro: PRO

  @BelongsTo(() => Material, { foreignKey: 'materialId', constraints: false, foreignKeyConstraint: false })
  material: Material
}
