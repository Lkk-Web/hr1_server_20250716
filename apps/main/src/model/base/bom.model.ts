import { Table, Column, Model, ForeignKey, DataType, BelongsTo, HasMany, Default } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { BomDetail } from '@model/base/bomDetail.model'

@Table({ tableName: `base_bom`, freezeTableName: true, timestamps: true, comment: 'BOM表' })
export class BOM extends BaseDate<BOM> {
  @Column({
    comment: '编码',
    type: DataType.STRING(50),
    allowNull: true, // 忽略时自动生成
  })
  declare code: string

  // 物料编码：外键，关联物料表
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  // 父物料编码：外键，关联BOM表
  @ForeignKey(() => BOM)
  @Default(0)
  @Column({
    comment: '父BOMId',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare parentId: number

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '物料名称',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare materialName: string

  @Column({
    comment: '版本',
    type: DataType.STRING,
    allowNull: true,
  })
  declare version: string

  @Column({
    comment: 'BOM 分组',
    type: DataType.STRING,
    allowNull: true,
  })
  declare group: string

  @Column({
    comment: 'BOM 分组名称',
    type: DataType.STRING,
    allowNull: true,
  })
  declare groupName: string

  @Column({
    comment: '物料规格',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare spec: string

  @Column({
    comment: '物料属性',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare attribute: string

  @Default(true)
  @Column({
    comment: '状态（启用/禁用）',
    type: DataType.BOOLEAN,
  })
  declare status: boolean

  @HasMany(() => BomDetail)
  declare bomDetails: BomDetail[]

  @BelongsTo(() => Material)
  declare parentMaterial: Material
}
