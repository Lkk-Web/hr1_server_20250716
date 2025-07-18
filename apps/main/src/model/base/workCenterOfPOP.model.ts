import { Table, Column, DataType, ForeignKey, HasMany, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { POP } from '@model/pe/POP.model'
import { WorkCenter } from './workCenter.model'
/** 车间 */
@Table({ tableName: `base_workcenter_POP`, freezeTableName: true, timestamps: true, comment: '工作中心表' })
export class WorkCenterOfPOP extends BaseDate<WorkCenterOfPOP> {
  @ForeignKey(() => WorkCenter)
  @Column({
    comment: '工作中心Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare workCenterId: number

  @ForeignKey(() => POP)
  @Column({
    comment: '工单工序Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare POPId: number

  @BelongsTo(() => WorkCenter)
  declare workCenter: WorkCenter

  @BelongsTo(() => POP)
  declare pop: POP
}
