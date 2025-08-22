import { Table, Column, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Team } from '@model/auth/team'
import { Process } from './process'
import { PositionDetail } from './positionDetail'

@Table({ tableName: `production_position`, freezeTableName: true, timestamps: true, comment: '工位表' })
export class Position extends BaseDate<Position> {
  //工位名称
  @Column({
    comment: '工位名称',
    type: DataType.STRING,
    allowNull: false, // 必填项
  })
  declare name: string

  //子工序ID
  @ForeignKey(() => Process)
  @Column({
    comment: '子工序ID',
    type: DataType.INTEGER,
  })
  declare processId: number

  @BelongsTo(() => Process)
  declare process: Process

  //班组
  @ForeignKey(() => Team)
  @Column({
    comment: '班组ID',
    type: DataType.INTEGER,
  })
  declare teamId: number

  @BelongsTo(() => Team)
  declare team: Team

  //状态
  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare status: boolean

  @HasMany(() => PositionDetail)
  declare positionDetails: PositionDetail[]
}
