import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { ProcessLocate } from './processLocate.model'
import { AuditStatus } from '@common/enum'

/** 派工单审核日志表 */
@Table({ tableName: `process_locate_audit_log`, freezeTableName: true, timestamps: true, comment: '派工单审核日志表' })
export class ProcessLocateAuditLog extends BaseDate<ProcessLocateAuditLog> {
  // 关联派工单ID
  @ForeignKey(() => ProcessLocate)
  @Column({
    comment: '派工单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processLocateId: number

  // 审核人员ID
  @ForeignKey(() => User)
  @Column({
    comment: '审核人员ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare auditorId: number

  // 审核状态
  @Column({
    comment: '审核状态',
    type: DataType.ENUM(...Object.values(AuditStatus)),
    allowNull: false,
  })
  declare auditStatus: AuditStatus

  // 审核备注
  @Column({
    comment: '审核备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare auditRemark: string

  // 审核时间
  @Column({
    comment: '审核时间',
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare auditTime: Date

  // 关联派工单
  @BelongsTo(() => ProcessLocate, 'processLocateId')
  declare processLocate: ProcessLocate

  // 关联审核人员
  @BelongsTo(() => User, 'auditorId')
  declare auditor: User
}
