import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material, Process, ProductionOrder, Organize, User, PerformancePriceDetail, Team, Position, PerformancePrice } from '..'

@Table({ tableName: `performance_price_total`, freezeTableName: true, timestamps: true, comment: '绩效计件统计表' })
export class PerformancePriceTotal extends BaseDate<PerformancePriceTotal> {
  @ForeignKey(() => Team)
  @Column({
    comment: '班组ID',
    type: DataType.INTEGER,
  })
  declare teamId: number

  @ForeignKey(() => User)
  @Column({
    comment: '员工ID',
    type: DataType.INTEGER,
  })
  declare updatedUserId: number

  @ForeignKey(() => Position)
  @Column({
    comment: '工位ID',
    type: DataType.INTEGER,
  })
  declare positionId: number

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

  //产品规格
  @Column({
    comment: '产品规格',
    type: DataType.STRING,
  })
  declare productSpec: string

  //报工计件数
  @Column({
    comment: '报工数量',
    type: DataType.INTEGER,
  })
  declare reportQuantity: number

  //总金额
  @Column({
    comment: '总金额',
    type: DataType.DECIMAL,
  })
  declare totalPrice: number

  @BelongsTo(() => Team)
  declare team: Team

  @BelongsTo(() => User)
  declare updatedUser: User

  @BelongsTo(() => Position)
  declare position: Position

  @BelongsTo(() => Material)
  declare material: Material

  @BelongsTo(() => PerformancePrice)
  declare performancePrice: PerformancePrice
}
