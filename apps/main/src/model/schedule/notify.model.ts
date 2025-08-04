import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { User } from '@model/auth/user'
import { BaseModel } from '@model/shared/base.model'
import { NOTIFY_SCENE } from '@common/enum'
import { ProductionProcessTask } from '@model/production/productionProcessTask.model'
import { Team } from '@model/schedule/team.model'

/** 班组 */
@Table({ tableName: `schedule_notify`, freezeTableName: true, timestamps: true, updatedAt: false, comment: '班组表' })
export class Notify extends BaseModel<Notify> {
  @ForeignKey(() => User)
  @Column({
    comment: '发送人id',
    type: DataType.INTEGER,
  })
  declare userId: number

  @ForeignKey(() => Team)
  @Column({
    comment: '班组id',
    type: DataType.INTEGER,
  })
  declare teamId: number

  @Column({
    comment: '名称',
    type: DataType.STRING,
  })
  declare name: string

  @ForeignKey(() => ProductionProcessTask)
  @Column({
    comment: '工序任务单id',
    type: DataType.INTEGER,
  })
  declare serialId: number

  @Column({
    comment: '场景',
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare scene: NOTIFY_SCENE

  @Column({
    comment: '主题',
    type: DataType.STRING,
    allowNull: false,
  })
  declare topic: string

  @Column({
    comment: '内容',
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content: string

  @Column({
    comment: '已读时间',
    type: DataType.DATE,
  })
  declare readTime: string | number | Date

  @CreatedAt
  @Column
  declare createdAt?: Date

  @BelongsTo(() => Team)
  declare team: Team

  @BelongsTo(() => ProductionProcessTask)
  declare processTask: ProductionProcessTask
}
