import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseModel } from '@model/shared/base.model'
import { ProductionOrderTask } from './productionOrderTask.model'
import { Team } from '@model/auth/team'

/** 生产工单与班组关联表 */
@Table({ tableName: `production_task_of_team`, freezeTableName: true, timestamps: true, comment: '生产工单任务与班组关联表' })
export class ProductionOrderTaskTeam extends BaseModel<ProductionOrderTaskTeam> {
  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '生产工单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionOrderTaskId: number

  @ForeignKey(() => Team)
  @Column({
    comment: '班组ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare teamId: number

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask

  @BelongsTo(() => Team)
  declare team: Team
}
