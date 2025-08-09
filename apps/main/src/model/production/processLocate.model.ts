import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { AuditStatus } from '@common/enum'
import { ProcessLocateDetail } from './processLocateDetail.model'
import { Material } from '@model/base/material.model'

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

  // 关联派工人员
  @BelongsTo(() => User, 'assignerId')
  declare assigner: User

  // 关联物料
  @BelongsTo(() => Material, 'materialId')
  declare material: Material

  @HasMany(() => ProcessLocateDetail)
  declare processLocateDetails: ProcessLocateDetail[]
}
