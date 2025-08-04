import { Material } from '@model/base/material.model'
import { Process } from '@model/process/process.model'
import { BaseDate } from '@model/shared/baseDate'
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { Performance } from './performance.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { User } from '@model/auth/user'
import { ProductionReport } from '@model/production/productionReport.model'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'

/** 绩效工资明细 */
@Table({ tableName: `performance_detaile`, freezeTableName: true, timestamps: true, comment: '绩效工资明细表' })
export class PerformanceDetailed extends BaseDate<PerformanceDetailed> {
  @Column({
    comment: '报工ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionReportId: number

  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @ForeignKey(() => Performance)
  @Column({
    comment: '绩效工资统计Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare performanceId: number

  @BelongsTo(() => Performance)
  declare performance: Performance

  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '工单id',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare productionOrderTaskId: number

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
    comment: '良品单价',
    type: DataType.INTEGER,
  })
  declare goodCountPrice: number

  @Column({
    comment: '不良品单价',
    type: DataType.INTEGER,
  })
  declare badCountPrice: number

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
    comment: '良品率',
    type: DataType.INTEGER,
  })
  declare yieldRate: number

  @Column({
    comment: '工资合计',
    type: DataType.INTEGER,
  })
  declare wages: number

  @BelongsTo(() => Material)
  material: Material

  @BelongsTo(() => Process)
  declare process: Process

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask

  @BelongsTo(() => User)
  declare user: User

  @BelongsTo(() => ProductionReport, { foreignKey: 'productionReportId', constraints: false, foreignKeyConstraint: false })
  declare productionReport: ProductionReport
}
