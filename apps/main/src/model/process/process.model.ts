import { BelongsToMany, Column, DataType, HasMany, HasOne, Table } from 'sequelize-typescript'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { BaseDate } from '@model/shared/baseDate'
import { ProcessItems } from '@model/process/processItems.model'
import { ProcessDept } from '@model/process/processDept.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { TeamProcess } from '@model/sm/teamProcess.model'
import { ProcessTask } from '@model/production/processTask.model'

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

  @Column({
    comment: '是否为外包工序',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isOut: boolean

  // @HasMany(()=>ProcessItems)
  // aaa : ProcessItems[]

  // @BelongsToMany(() => SYSOrg, { through: () => ProcessDept,constraints:false,foreignKeyConstraint:false,foreignKey:'processId',otherKey:'deptId' })
  // processDept: SYSOrg[]

  // @BelongsToMany(() => DefectiveItem, { through: () => ProcessItems,constraints:false,foreignKeyConstraint:false,foreignKey:'processId',otherKey:'defectiveItemId' })
  @BelongsToMany(() => SYSOrg, { through: () => ProcessDept, uniqueKey: 'process_pd_so_unique', foreignKey: 'processId', otherKey: 'deptId' })
  processDept: SYSOrg[]

  @BelongsToMany(() => DefectiveItem, { through: () => ProcessItems, uniqueKey: 'process_pi_di_unique', foreignKey: 'processId', otherKey: 'defectiveItemId' })
  processItem: DefectiveItem[]

  declare performanceConfig: PerformanceConfig

  @HasMany(() => ProcessDept)
  declare processDeptList: ProcessDept[]

  @HasMany(() => ProcessTask)
  declare tasks: ProcessTask[]

  @HasOne(() => TeamProcess)
  declare teamProcess: TeamProcess
}
