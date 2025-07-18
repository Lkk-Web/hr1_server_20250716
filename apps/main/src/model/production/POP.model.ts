import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { Process } from '@model/process/process.model'
import { SYSOrg } from '@model/sys/SYSOrg.model'
import { DefectiveItem } from '@model/quantity/defectiveItem.model'
import { POD } from '@model/production/PODmodel'
import { POI } from '@model/production/POI.model'
import { PerformanceConfig } from '@model/performance/performanceConfig.model'
import { ProcessTask } from '@model/production/processTask.model'
import { FileList } from '@model/document/FileList.model'
import { WorkCenterOfPOP } from '@model/base/workCenterOfPOP.model'
import { WorkCenter } from '@model/base/workCenter.model'

@Table({ tableName: `production_POP`, freezeTableName: true, timestamps: true, comment: '生产工单工序关联表' })
export class POP extends BaseDate<POP> {
  //工单ID
  @ForeignKey(() => ProductionOrder)
  @Column({
    comment: '工单Id',
    type: DataType.STRING,
    allowNull: false, // 必填项
  })
  declare productionOrderId: string

  @ForeignKey(() => Process)
  @Column({
    comment: '工序ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
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

  @Column({
    comment: '是否报工',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isReport: boolean

  @Column({
    comment: '是否委外',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isOutsource: boolean

  @Column({
    comment: 'sort',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort: number

  @Column({
    comment: '计划数',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare planCount: number

  @Column({
    comment: '良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare goodCount: number

  @Column({
    comment: '不良品数',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare badCount: number

  @ForeignKey(() => FileList)
  @Column({
    comment: 'fileId',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare fileId: number

  // 状态
  @Column({
    comment: '状态 (未开始, 执行中, 已暂停, 已取消, 已完成)',
    type: DataType.STRING(10),
    allowNull: false, // 必填项
    defaultValue: '未开始',
  })
  declare status: string

  // 计划开始时间
  @Column({
    comment: '计划开始时间',
    type: DataType.DATE,
    allowNull: false, // 必填项
  })
  declare startTime: Date

  // 计划结束时间
  @Column({
    comment: '计划结束时间',
    type: DataType.DATE,
    allowNull: false, // 必填项
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
    comment: '工序任务单ID',
    type: DataType.INTEGER,
    allowNull: true, // 必填项
  })
  declare processTaskId: number

  @Column({
    comment: '是否进行质检',
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare isInspection: boolean

  @Default(0)
  @Column({
    comment: '报工数',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare reportQuantity: number

  @BelongsTo(() => Process)
  process: Process

  @BelongsTo(() => FileList)
  file: FileList

  @BelongsTo(() => ProductionOrder)
  productionOrder: ProductionOrder

  @BelongsToMany(() => SYSOrg, { through: () => POD, uniqueKey: 'POP_pod_so_unique', foreignKey: 'popId', otherKey: 'deptId' })
  depts: SYSOrg[]

  @BelongsToMany(() => DefectiveItem, { through: () => POI, uniqueKey: 'POP_poi_di_unique', foreignKey: 'popId', otherKey: 'defectiveItemId' })
  items: DefectiveItem[]

  @BelongsToMany(() => WorkCenter, { through: () => WorkCenterOfPOP, foreignKey: 'POPId', otherKey: 'workCenterId' })
  workCenter: WorkCenter[]

  @BelongsTo(() => ProcessTask, { foreignKey: 'processTaskId', constraints: false, foreignKeyConstraint: false })
  processTask: ProcessTask

  declare performanceConfig: PerformanceConfig
}
