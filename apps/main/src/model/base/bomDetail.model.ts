import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { BOM } from '@model/base/bom.model'
import { Material } from '@model/base/material.model'

@Table({ tableName: `base_bom_detail`, freezeTableName: true, timestamps: true, comment: 'BOM子项物料表' })
export class BomDetail extends BaseDate<BomDetail> {
  // 父物料编码：外键，关联物料表
  @ForeignKey(() => BOM)
  @Column({
    comment: 'bomId',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare bomId: number

  // 数量
  @Column({
    comment: '序号',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare sort: number

  @ForeignKey(() => Material)
  @Column({
    comment: 'materialId',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare materialId: number

  // 数量
  @Column({
    comment: '数量',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare quantity: number

  @Column({
    comment: '物料规格',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare spec: string

  @Column({
    comment: '物料名称',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare materialName: string

  @Column({
    comment: '物料属性',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare attr: string

  @Column({
    comment: '子项单位',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare unit: string

  @Column({
    comment: '投料工序',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare feedProcessId: number

  @Column({
    comment: '图号',
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare figureNumber: string

  // 子项Bom编码
  @Column({
    comment: '子项Bom编码',
    type: DataType.STRING,
    allowNull: true,
  })
  declare subBomCode: string

  @BelongsTo(() => BOM)
  declare bom: BOM

  @BelongsTo(() => Material)
  declare parentMaterial: Material

  declare items: any
}
