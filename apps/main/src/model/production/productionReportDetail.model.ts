import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { ProcessPositionTask } from './processPositionTask.model'
import { ProductionReport } from './productionReport.model'
import { ProductionOrderTaskOfReport } from './productionOrderTaskOfReport'

@Table({ tableName: `production_report_detail`, timestamps: true, comment: '生产报工表 - 工位任务单' })
export class ProductionReportDetail extends BaseDate<ProductionReportDetail> {
  @ForeignKey(() => ProductionReport)
  @Column({
    comment: '报工单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionReportId: number

  @ForeignKey(() => ProductionOrderTaskOfReport)
  @Column({
    comment: '工单关联任务ID',
    field: 'taskOfReportId',
    type: DataType.INTEGER,
    allowNull: true
  })
  declare taskOfReportId: number

  @BelongsTo(() => ProductionOrderTaskOfReport, {
    foreignKey: 'taskOfReportId',
    constraints: false
  })
  declare productionOrderTaskOfReport?: ProductionOrderTaskOfReport

  @ForeignKey(() => ProcessPositionTask)
  @Column({
    comment: '工位任务单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processPositionTaskId: number

  @Column({
    comment: '铁芯序列号',
    type: DataType.STRING(255),
  })
  declare ironSerial: string

  @Column({
    comment: '开始时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date

  @Column({
    comment: '结束时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare endTime: Date

  @Column({
    comment: '报工时长（小时）',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare reportDurationHours: number

  @Column({
    comment: '报工时长（分钟）',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare reportDurationMinutes: number

  @Column({
    comment: '报工数量',
    type: DataType.INTEGER,
    defaultValue: 1,
    allowNull: false,
  })
  declare reportQuantity: number

  @Column({
    comment: '单位',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare unit: string

  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare goodCount: number

  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare badCount: number

  @Column({
    comment: '达标率',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare complianceRate: number

  // 计件方式
  @Column({
    comment: '计件方式 (计件 / 计时)',
    type: DataType.ENUM('计件', '计时'),
    allowNull: true,
    defaultValue: '计时',
  })
  declare accountingType: string

  @Column({
    comment: '良品单价（分）',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare goodCountPrice: number

  @Column({
    comment: '不良品单价（分）',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare badCountPrice: number

  // 预计工资
  @Column({
    comment: '预计工资',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare estimatedWage: number

  @Column({
    comment: '标准工时（秒）',
    type: DataType.INTEGER,
    defaultValue: 3600,
  })
  declare canonTime: number

  @Column({
    comment: '标准产出',
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare canonNum: number

  @Column({
    comment: '是否进行质检',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare isInspection: boolean

  @Column({
    comment: '检验类型',
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare type: string

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '批次号',
  })
  declare batNum: string



  @BelongsTo(() => ProcessPositionTask, {
    foreignKey: 'processPositionTaskId',
    constraints: false
  })
  processPositionTask: ProcessPositionTask

  declare performanceConfig: PerformanceConfig
  declare durationUsers: { duration: number; user: User }[]
}
