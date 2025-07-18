import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Process } from '@model/process/process.model'
import { ProductionOrder } from '@model/pe/productionOrder.model'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { ProcessTaskDept } from '@model/pe/processTaskDept.model'
import { User } from '@model/sys/user.model'
import { ProcessTaskUser } from '@model/pe/processTaskUser.model'
import { PerformanceConfig } from '@model/pp/performanceConfig.model'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { ProcessTaskLog } from '@model/pe/processTaskLog.model'

@Table({ tableName: `pe_process_task`, timestamps: true, freezeTableName: true, comment: '工序任务单表' })
export class ProcessTask extends BaseDate<ProcessTask> {
  //工单ID
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '工单id',
    type: DataType.STRING(255),
    allowNull: true, // 必填项
  })
  declare productionOrderId: string

  @ForeignKey(() => Process)
  // 工序名称
  @Column({
    comment: '工序ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  // 报工数比例
  @Column({
    comment: '报工数比例',
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
  })
  declare reportRatio: number

  // 计划数
  @Column({
    comment: '计划数',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare planCount: number

  // 良品数
  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare goodCount: number

  // 不良品数
  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare badCount: number

  // 单位
  @Column({
    comment: '单位',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare unit: string

  // 工序状态
  @Column({
    comment: '工序状态 (未开始, 执行中, 已结束)',
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare status: PROCESS_TASK_STATUS | string

  @Column({
    comment: '是否委外',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isOutsource: boolean

  @Column({
    comment: '是否进行质检',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare isInspection: boolean

  // 优先级
  @Column({
    comment: '优先级 (加急, 普通, 暂停, 无)',
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: '无',
  })
  declare priority: string

  // 计划开始时间
  @Column({
    comment: '计划开始时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date

  // 计划结束时间
  @Column({
    comment: '计划结束时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare endTime: Date

  // 实际开始时间
  @Column({
    comment: '实际开始时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare actualStartTime: Date

  // 实际结束时间
  @Column({
    comment: '实际结束时间',
    type: DataType.DATE,
    allowNull: true, // 可选项
  })
  declare actualEndTime: Date

  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  @Column({
    comment: '返工数',
    type: DataType.INTEGER,
  })
  declare workCount: number

  @Default(0)
  @Column({
    comment: '接收数',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare receptionCount: number

  @Default(0)
  @Column({
    comment: '报工数',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare reportQuantity: number

  @BelongsTo(() => ProductionOrder)
  declare order: ProductionOrder

  @BelongsTo(() => Process)
  declare process: Process

  @BelongsToMany(() => SYSOrg, { through: () => ProcessTaskDept, uniqueKey: 'ProcessTask_ptd_so_unique', foreignKey: 'taskId', otherKey: 'deptId' })
  declare depts: SYSOrg[]

  @BelongsToMany(() => User, { through: () => ProcessTaskUser, uniqueKey: 'ProcessTask_ptu_user_unique', foreignKey: 'taskId', otherKey: 'userId' })
  declare users: User[]

  declare performanceConfig: PerformanceConfig

  declare sop

  @HasMany(() => ProcessTaskLog)
  declare operateLogs: ProcessTaskLog[]
}
