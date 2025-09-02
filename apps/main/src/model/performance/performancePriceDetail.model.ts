import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material, Process, ProductionOrder, Organize, User } from '..'
import { PerformancePrice } from './performancePrice.model'

@Table({ tableName: `performance_price_detail`, freezeTableName: true, timestamps: true, comment: '绩效工价明细表' })
export class PerformancePriceDetail extends BaseDate<PerformancePriceDetail> {
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
  })
  declare materialId: number

  @ForeignKey(() => PerformancePrice)
  @Column({
    comment: '绩效工价Id',
    type: DataType.INTEGER,
  })
  declare performancePriceId: number

  @BelongsTo(() => PerformancePrice)
  declare performancePrice: PerformancePrice

  @BelongsTo(() => Material)
  declare material: Material
}
