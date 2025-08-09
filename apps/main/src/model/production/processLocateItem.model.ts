import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { ProcessPositionTask } from './processPositionTask.model'
import { ProcessLocateDetail } from './processLocateDetail.model'

/** 派工序列表 */
@Table({
  tableName: `process_locate_item`,
  freezeTableName: true,
  timestamps: true,
  comment: '派工序列表',
  // indexes: [
  //   {
  //     unique: true,
  //     name: 'uniq_detail_task',
  //     fields: ['processLocateDetailId', 'processPositionTaskId'], // 组合唯一索引
  //   },
  // ],
})
export class ProcessLocateItem extends BaseDate<ProcessLocateItem> {
  // 派工主表ID
  @ForeignKey(() => ProcessLocateDetail)
  @Column({
    comment: '派工明细表ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processLocateDetailId: number

  // 工位任务单ID
  @ForeignKey(() => ProcessPositionTask)
  @Column({
    unique: true,
    comment: '工位任务单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare processPositionTaskId: number

  // 关联派工主表
  @BelongsTo(() => ProcessLocateDetail, 'processLocateDetailId')
  declare processLocateDetail: ProcessLocateDetail

  @BelongsTo(() => ProcessPositionTask, 'processPositionTaskId')
  declare processPositionTask: ProcessPositionTask
}
