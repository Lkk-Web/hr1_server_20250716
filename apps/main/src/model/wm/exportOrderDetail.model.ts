import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { ExportOrder } from '@model/wm/exportOrder.model'
import { Material } from '@model/base/material.model'

import { StrBaseModel } from '@model/shared/strBase.model'

@Table({ tableName: `wm_export_orderDetail`, freezeTableName: true, timestamps: true, comment: '出入库单明细表' })
export class ExportOrderDetail extends StrBaseModel<ExportOrderDetail> {
  @ForeignKey(() => ExportOrder)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: '出入库单号',
  })
  declare exportOrderId: string

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
    comment: '待检数量',
  })
  declare pendCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '已检数量',
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
    comment: '规格型号',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare spec: string

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '出入库时间',
  })
  declare date: Date

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: '一物一码集合',
  })
  declare itemCodes: string[]

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    comment: '来料检验',
    defaultValue: 0,
  })
  declare incomeInspect: boolean

  @BelongsTo(() => Material)
  material: Material

  declare warehouseCount: number
}
