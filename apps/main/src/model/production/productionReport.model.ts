import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { Process } from '@model/process/process.model'
import { User } from '@model/sys/user.model'
import { PRI } from '@model/production/PRI.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { ProcessTask } from '@model/production/processTask.model'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { Team } from '@model/sm/team.model'
import { ReportUser } from '@model/production/reportUser.model'

@Table({ tableName: `production_report`, timestamps: true, comment: '生产报工表' })
export class ProductionReport extends BaseDate<ProductionReport> {
  //工单ID
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '工单id',
    type: DataType.STRING(255),
    allowNull: true, // 必填项
  })
  declare productionOrderId: string

  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare taskId: number

  @Column({
    comment: '工序状态（未开始，执行中,已结束）',
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: '未开始',
  })
  declare processStatus: PROCESS_TASK_STATUS | string

  @ForeignKey(() => User)
  @Column({
    comment: '生产人员',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare productUserId: number

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
    comment: '工序进度',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare processProgress: string

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
    comment: '审核状态（未审核，已审核）',
    type: DataType.STRING,
    allowNull: true,
    defaultValue: '未审核',
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
    comment: '创建人',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare createdUserId: number

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

  @BelongsTo(() => ProductionOrder, { foreignKey: 'productionOrderId', constraints: false, foreignKeyConstraint: false })
  order: ProductionOrder

  @BelongsTo(() => Process)
  process: Process

  @BelongsTo(() => ProcessTask, { foreignKey: 'taskId', constraints: false, foreignKeyConstraint: false })
  task: ProcessTask

  @BelongsTo(() => User, 'productUserId')
  productUser: User

  @BelongsTo(() => User, 'auditorId')
  auditor: User

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @BelongsTo(() => Team, 'teamId')
  team: Team

  @HasMany(() => PRI)
  pri: PRI[]

  @HasMany(() => ReportUser)
  declare reportUsers: ReportUser[]

  declare performanceConfig: PerformanceConfig
  declare durationUsers: { duration: number; user: User }[]
}
