import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { POSITION_TASK_STATUS, PROCESS_TASK_STATUS } from '@common/enum'
import { ProcessTaskLog } from '@model/production/processTaskLog.model'
import { ProcessTask } from './processTask.model'
import { Process } from '@model/process/process.model'
import { ProductionReport } from './productionReport.model'
import { ProductSerial } from './productSerial.model'
import { ProductionOrderTask } from './productionOrderTask.model'
import { ProcessLocateItem } from './processLocateItem.model'

//工位任务单
@Table({ tableName: `process_position_task`, timestamps: true, freezeTableName: true, comment: '工位任务单' })
export class ProcessPositionTask extends BaseDate<ProcessPositionTask> {
  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '生产工单ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare productionOrderTaskId: number

  //产品序列号id
  @ForeignKey(() => ProductSerial)
  @Column({
    comment: '产品序列号id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare serialId: number

  //工序任务单id
  @ForeignKey(() => ProcessTask)
  @Column({
    comment: '工序任务单id',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare processTaskId: number

  //操作工id
  @ForeignKey(() => User)
  @Column({
    comment: '操作工id',
    type: DataType.INTEGER,
  })
  declare userId: number

  @ForeignKey(() => Process)
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

  // 任务状态
  @Column({
    comment: '任务状态 (待派工, 待审核, 未开始, 执行中, 已暂停, 已完成)',
    type: DataType.ENUM(...Object.values(POSITION_TASK_STATUS)),
    defaultValue: POSITION_TASK_STATUS.TO_ASSIGN,
    allowNull: false,
  })
  declare status: POSITION_TASK_STATUS

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

  @HasMany(() => ProductionReport)
  declare productionReport: ProductionReport[]

  @BelongsTo(() => ProductSerial)
  declare serial: ProductSerial

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask

  @BelongsTo(() => ProcessTask)
  declare processTask: ProcessTask

  @BelongsTo(() => User)
  declare user: User

  @BelongsTo(() => Process)
  declare process: Process

  @HasOne(() => ProcessLocateItem)
  declare locate: ProcessLocateItem

  @HasMany(() => ProcessTaskLog)
  declare operateLogs: ProcessTaskLog[]
}
