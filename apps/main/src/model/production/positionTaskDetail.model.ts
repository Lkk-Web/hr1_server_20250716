import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Position } from './position.model'
import { User } from '@model/auth/user'
import { PositionDetail } from './positionDetail.model'
import { ProductionOrderTask } from '..'
@Table({ tableName: `position_task_detail`, freezeTableName: true, timestamps: true, comment: '工位人员明细表' })
export class PositionTaskDetail extends BaseDate<PositionTaskDetail> {
  //工位ID
  @ForeignKey(() => PositionDetail)
  @Column({
    comment: '工位详情Id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare positionDetailId: number

  //工位ID
  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '工单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionOrderTaskId: number

  @Column({
    comment: '可开工数量',
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  allowWorkNum: number

  @Column({
    comment: '已开工数量',
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  workNum: number

  @Column({
    comment: '已完成数量',
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  completeNum: number

  @BelongsTo(() => PositionDetail)
  declare positionDetail: PositionDetail

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask
}
