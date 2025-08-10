import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { AuditStatus } from '@common/enum'
import { ProcessLocateDetail } from './processLocateDetail.model'
import { Material } from '@model/base/material.model'
import { ProductionOrderTask } from './productionOrderTask.model'
import { Process } from '@model/process/process.model'

/** 派工表 */
@Table({ tableName: `process_locate`, freezeTableName: true, timestamps: true, comment: '派工表' })
export class ProcessLocate extends BaseDate<ProcessLocate> {
  // 派工编号
  @Column({
    comment: '派工编号',
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare locateCode: string

  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '生产工单ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare productionOrderTaskId: number

  // 派工人员ID
  @ForeignKey(() => User)
  @Column({
    comment: '派工人员ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare assignerId: number

  // 物料
  @ForeignKey(() => Material)
  @Column({
    comment: '物料Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare materialId: number

  // 工序
  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare parentProcessId: number

  // 派工时间
  @Column({
    comment: '派工时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare assignTime: Date

  // 状态 (0: 待执行, 1: 执行中, 2: 已完成, 3: 已取消)
  @Column({
    type: DataType.ENUM(...Object.values(AuditStatus)),
    comment: '派工状态 (待审核, 已通过, 已驳回)',
    allowNull: false, // 必填项
    defaultValue: '待审核',
  })
  declare status: AuditStatus

  // 备注
  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  // 审核人员ID
  @ForeignKey(() => User)
  @Column({
    comment: '审核人员ID',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare auditorId: number

  // 审核时间
  @Column({
    comment: '审核时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare auditTime: Date

  // 审核备注
  @Column({
    comment: '审核备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare auditRemark: string

  // 关联派工人员
  @BelongsTo(() => User, 'assignerId')
  declare assigner: User

  // 关联审核人员
  @BelongsTo(() => User, 'auditorId')
  declare auditor: User

  // 关联物料
  @BelongsTo(() => Material, 'materialId')
  declare material: Material

  // 关联生产工单
  @BelongsTo(() => ProductionOrderTask, 'productionOrderTaskId')
  declare productionOrderTask: ProductionOrderTask

  // 关联工序
  @BelongsTo(() => Process, 'parentProcessId')
  declare parentProcess: Process

  @HasMany(() => ProcessLocateDetail)
  declare processLocateDetails: ProcessLocateDetail[]
}
