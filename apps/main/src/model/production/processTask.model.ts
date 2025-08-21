import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Process } from '@model/process/process.model'
import { Organize } from '@model/auth/organize'
import { ProcessTaskDept } from '@model/production/processTaskDept.model'
import { User } from '@model/auth/user'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { PROCESS_TASK_STATUS } from '@common/enum'
import { ProcessTaskLog } from '@model/production/processTaskLog.model'
import { ProductSerial } from './productSerial.model'
import { FileList } from '@model/document/FileList.model'
import { ProcessPositionTask } from './processPositionTask.model'
import { ProductionOrderTask } from './productionOrderTask.model'

@Table({ tableName: `process_task`, timestamps: true, freezeTableName: true, comment: '工序任务单表 - 关联产品序列号' })
export class ProcessTask extends BaseDate<ProcessTask> {
  //产品序列号id
  @ForeignKey(() => ProductSerial)
  @Column({
    comment: '产品序列号id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare serialId: number

  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '生产工单ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare productionOrderTaskId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  @Column({
    comment: 'sort',
    type: DataType.INTEGER,
  })
  declare sort: number

  @Column({
    comment: '是否报工',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isReport: boolean

  @ForeignKey(() => FileList)
  @Column({
    comment: 'fileId',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare fileId: number

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

  @BelongsTo(() => ProductSerial)
  declare serial: ProductSerial

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask

  @BelongsTo(() => Process)
  declare process: Process

  @BelongsTo(() => FileList)
  file: FileList

  @BelongsToMany(() => Organize, { through: () => ProcessTaskDept, uniqueKey: 'ProcessTask_ptd_so_unique', foreignKey: 'taskId', otherKey: 'deptId' })
  declare depts: Organize[]

  declare performanceConfig: PerformanceConfig

  declare sop

  @HasMany(() => ProcessTaskLog)
  declare operateLogs: ProcessTaskLog[]

  @HasMany(() => ProcessPositionTask)
  declare processPositionTasks: ProcessPositionTask[]
}
