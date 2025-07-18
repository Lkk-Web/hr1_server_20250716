import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { Material, Process, ProductionOrder, SYSOrg, User } from '..'
import { PerformanceDetailed } from './performanceDetailed.model'

/** 绩效工资统计 */
@Table({ tableName: `performance`, freezeTableName: true, timestamps: true, comment: '绩效工资统计表' })
export class Performance extends BaseDate<Performance> {
  @ForeignKey(() => SYSOrg)
  @Column({
    comment: '部门Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare deptId: number

  @ForeignKey(() => User)
  @Column({
    comment: '用户Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number

  // 良品数
  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
  })
  declare goodCount: number

  // 不良品数
  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
  })
  declare badCount: number

  @Column({
    comment: '良品率',
    type: DataType.INTEGER,
  })
  declare yieldRate: number

  @Column({
    comment: '良品工资',
    type: DataType.INTEGER,
  })
  declare goodCountWages: number

  @Column({
    comment: '不良品工资',
    type: DataType.INTEGER,
  })
  declare badCountWages: number

  @Column({
    comment: '工资合计',
    type: DataType.INTEGER,
  })
  declare wages: number

  @BelongsTo(() => SYSOrg)
  declare dept: SYSOrg

  @BelongsTo(() => User)
  declare user: User

  @HasMany(() => PerformanceDetailed)
  declare performanceDetailed: PerformanceDetailed[]
}
