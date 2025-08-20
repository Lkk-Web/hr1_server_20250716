import { Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Position } from './position.model'
import { User } from '@model/auth/user'
@Table({ tableName: `production_position_detail`, freezeTableName: true, timestamps: true, comment: '工位人员明细表' })
export class PositionDetail extends BaseDate<PositionDetail> {
  //工位ID
  @ForeignKey(() => Position)
  @Column({
    comment: '工位ID',
    type: DataType.INTEGER,
  })
  declare positionId: number

  @BelongsTo(() => Position)
  declare position: Position

  //人员
  @ForeignKey(() => User)
  @Column({
    comment: '人员ID',
    type: DataType.INTEGER,
  })
  declare userId: number

  @BelongsTo(() => User)
  declare user: User
}
