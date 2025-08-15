import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Process } from '@model/process/process.model'
import { User } from '@model/auth/user'
import { PRI } from '@model/production/PRI.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { Team } from '@model/auth/team'
import { UserTaskDuration } from '@model/production/userTaskDuration.model'
import { ProductionOrderTask } from './productionOrderTask.model'
import { ProductionReportDetail } from './productionReportDetail.model'
import { ProductionOrderTaskOfReport } from './productionOrderTaskOfReport'

@Table({ tableName: `production_report`, timestamps: true, comment: '生产报工表 - 序列号 - 工序' })
export class ProductionReport extends BaseDate<ProductionReport> {
  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @ForeignKey(() => User)
  @Column({
    comment: '生产人员',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare productUserId: number

  @Column({
    comment: '总报工时长（小时）',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare allReportDurationHours: number

  @Column({
    comment: '总报工时长（分钟）',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare allReportDurationMinutes: number

  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare allGoodCount: number

  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare allBadCount: number

  @Column({
    comment: '达标率',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare complianceRate: number

  // 计件方式
  @Column({
    comment: '计件方式 (计件 / 计时)',
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: '计时',
  })
  declare accountingType: string

  // 预计工资
  @Column({
    comment: '总预计工资',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare allEstimatedWage: number

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
    comment: '审核状态（待审核，已通过，已驳回）',
    type: DataType.ENUM('待审核', '已通过', '已驳回'),
    allowNull: true,
    defaultValue: '待审核',
  })
  declare auditStatus: string

  @ForeignKey(() => User)
  @Column({
    comment: '审核人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare auditorId: number

  @Column({
    comment: '审核时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare auditedAt?: Date

  @ForeignKey(() => User)
  @Column({
    comment: '修改人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare updatedUserId: number

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '批次号',
  })
  declare batNum: string

  @ForeignKey(() => Team)
  @Column({
    comment: '班组ID',
    type: DataType.INTEGER,
  })
  declare teamId: number

  @BelongsTo(() => Process)
  process: Process

  @BelongsTo(() => User, 'productUserId')
  productUser: User

  @BelongsTo(() => User, 'auditorId')
  auditor: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @BelongsTo(() => Team, 'teamId')
  team: Team

  @HasMany(() => PRI)
  pri: PRI[]

  @HasMany(() => UserTaskDuration)
  declare reportUsers: UserTaskDuration[]

  @BelongsToMany(() => ProductionOrderTask, () => ProductionOrderTaskOfReport, 'reportId', 'productionOrderTaskId')
  declare productionOrderTask: ProductionOrderTask[]

  @HasMany(() => ProductionReportDetail)
  declare productionReportDetails: ProductionReportDetail[]

  declare performanceConfig: PerformanceConfig
  declare durationUsers: { duration: number; user: User }[]
}
