import { BelongsToMany, Column, DataType, HasMany, HasOne, Table, BelongsTo } from 'sequelize-typescript'
import { Organize } from '@model/auth/organize'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { BaseDate } from '@model/shared/baseDate'
import { ProcessItems } from '@model/process/processItems.model'
import { ProcessDept } from '@model/process/processDept.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { TeamProcess } from '@model/auth/teamProcess.model'
import { ProcessTask } from '@model/production/processTask.model'
import { SOP } from './SOP.model'

/** 工序表 */
@Table({ tableName: `process`, freezeTableName: true, timestamps: true, comment: '工序表' })
export class Process extends BaseDate<Process> {
  // 工序名称
  @Column({
    comment: '工序名称',
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare processName: string

  // 报工数比例
  @Column({
    comment: '报工数比例',
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1,
  })
  declare reportRatio: number

  // 父级工序ID
  @Column({
    comment: '父级工序ID',
    type: DataType.INTEGER,
  })
  declare parentId: number

  //1为父工序 0为子工序
  @Column({
    comment: '是否为子工序',
    type: DataType.INTEGER,
  })
  declare isChild: number

  @Column({
    comment: '是否为质检',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isQC: boolean

  // @Column({
  //   comment: '是否绑定托盘',
  //   type: DataType.BOOLEAN,
  //   allowNull: false,
  //   defaultValue: false,
  // })
  // declare isTP: boolean

  // 排序字段
  @Column({
    comment: '排序字段',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare sort: number

  // 添加父子关系关联
  @BelongsTo(() => Process, { foreignKey: 'parentId', as: 'parent' })
  declare parent: Process

  @HasMany(() => Process, { foreignKey: 'parentId', as: 'children' })
  declare children: Process[]

  @BelongsToMany(() => Organize, { through: () => ProcessDept, uniqueKey: 'process_pd_so_unique', foreignKey: 'processId', otherKey: 'deptId' })
  processDept: Organize[]

  @BelongsToMany(() => DefectiveItem, { through: () => ProcessItems, uniqueKey: 'process_pi_di_unique', foreignKey: 'processId', otherKey: 'defectiveItemId' })
  processItem: DefectiveItem[]

  declare performanceConfig: PerformanceConfig

  @HasMany(() => ProcessDept)
  declare processDeptList: ProcessDept[]

  @HasMany(() => ProcessTask)
  declare tasks: ProcessTask[]

  @HasMany(() => SOP)
  declare sopList: SOP[]

  @HasOne(() => TeamProcess)
  declare teamProcess: TeamProcess
}
