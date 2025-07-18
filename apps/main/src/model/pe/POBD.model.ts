import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { Material } from '@model/base/material.model'
import { ProductionOrder } from '@model/pe/productionOrder.model'
import { ProcessRouteList } from '@model/pm/processRouteList.model'
import { Process } from '@model/pm/process.model'
import { BOM } from '@model/base/bom.model'
import { POB } from '@model/pe/POB.model'
import { Warehouse } from '@model/wm/warehouse.model'

@Table({ tableName: `pe_POBD`, freezeTableName: true, timestamps: true, comment: '生产工单用料清单子项明细表' })
export class POBD extends BaseDate<POBD> {
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
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare ratio: number

  @Column({
    comment: '子项类型',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare type: string

  @Column({
    comment: '分子',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare numerator: number

  @Column({
    comment: '分母',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare denominator: number

  @Column({
    comment: '应发数量',
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare sendCount: number

  @Column({
    comment: '长度',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare length: string

  @Column({
    comment: '发料方式',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare method: string

  @ForeignKey(() => Warehouse)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '仓库Id',
  })
  declare warehouseId: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '调拨数量',
  })
  declare transferCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '已领数量',
  })
  declare receivedCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '未领数量',
  })
  declare unclaimedCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '补领数量',
  })
  declare replaceCount: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '实领数量',
  })
  declare actualReceived: number

  @BelongsTo(() => Material)
  material: Material
}
