import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { POB } from '@model/production/POB.model'
import { Warehouse } from '@model/warehouse/warehouse.model'

@Table({ tableName: `production_POB_detail`, freezeTableName: true, timestamps: true, comment: '生产工单用料清单子项明细表' })
export class POBDetail extends BaseDate<POBDetail> {
  @ForeignKey(() => POB)
  @Column({
    comment: '用料清单Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare pobId: number

  @Column({
    comment: '项次',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare item: number

  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  // 数量
  @Column({
    comment: '使用比例',
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
  })
  declare ratio: number

  @Column({
    comment: '分子',
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
  })
  declare numerator: number

  @Column({
    comment: '应发数量',
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
  })
  declare sendCount: number

  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
    comment: '已领数量',
  })
  declare receivedCount: number

  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: true,
    comment: '未领数量',
  })
  declare unclaimedCount: number

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '金蝶原始数据',
  })
  declare jsonData: string

  @BelongsTo(() => Material)
  material: Material
}
