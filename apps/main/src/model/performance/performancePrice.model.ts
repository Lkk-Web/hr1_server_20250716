import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material, Process, ProductionOrder, Organize, User, PerformancePriceDetail } from '..'

@Table({ tableName: `performance_price`, freezeTableName: true, timestamps: true, comment: '绩效工价表' })
export class PerformancePrice extends BaseDate<PerformancePrice> {
  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
  })
  declare processId: number

  //产品规格
  @Column({
    comment: '产品规格',
    type: DataType.STRING,
  })
  declare productSpec: string

  @Column({
    comment: '工价',
    type: DataType.DECIMAL(10, 2),
  })
  declare price: number

  @Column({ type: DataType.INTEGER, comment: '状态（0禁用/1启用）', defaultValue: 1 })
  declare status: number

  @BelongsTo(() => Process)
  declare process: Process

  @HasMany(() => PerformancePriceDetail)
  declare performanceDetailed: PerformancePriceDetail[]
}
