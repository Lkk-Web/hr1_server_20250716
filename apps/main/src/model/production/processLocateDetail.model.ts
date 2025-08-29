import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { ProcessLocate } from './processLocate.model'
import { AuditStatus } from '@common/enum'
import { Process } from '@model/process/process.model'

/** 派工详情表 */
@Table({ tableName: `process_locate_detail`, freezeTableName: true, timestamps: true, comment: '派工详情表' })
export class ProcessLocateDetail extends BaseDate<ProcessLocateDetail> {
  // 派工主表ID
  @ForeignKey(() => ProcessLocate)
  @Column({
    comment: '派工主表ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processLocateId: number

  // 指定人员ID
  @ForeignKey(() => User)
  @Column({
    comment: '指定人员ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number

  // 工序
  @ForeignKey(() => Process)
  @Column({
    comment: '工序',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processId: number

  // 待派数量
  @Column({
    comment: '待派数量',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare pendingCount: number

  // 分配数量
  @Column({
    comment: '分配数量',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare assignCount: number

  @Column({
    comment: '状态',
    type: DataType.ENUM(...Object.values(AuditStatus)),
    allowNull: false,
    defaultValue: AuditStatus.PENDING_REVIEW,
  })
  declare status: AuditStatus

  // 开始时间
  @Column({
    comment: '开始时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare startTime: Date

  // 完成时间
  @Column({
    comment: '完成时间',
    type: DataType.DATE,
    allowNull: true,
  })
  declare finishTime: Date

  // 备注
  @Column({
    comment: '备注',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remark: string

  // 关联派工主表
  @BelongsTo(() => ProcessLocate, 'processLocateId')
  declare processLocate: ProcessLocate

  // 关联指定人员
  @BelongsTo(() => User, 'userId')
  declare user: User

  // 关联工序
  @BelongsTo(() => Process, 'processId')
  declare process: Process
}
