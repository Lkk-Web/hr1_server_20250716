import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseModel } from '@model/shared/base.model'
import { ProductionOrderTask } from './productionOrderTask.model'
import { ProductionReport } from './productionReport.model'

/** 生产工单与报工单关联表 */
@Table({ tableName: `production_task_of_report`, freezeTableName: true, timestamps: true, comment: '生产工单任务与报工单关联表' })
export class ProductionOrderTaskOfReport extends BaseModel<ProductionOrderTaskOfReport> {
  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '生产工单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare productionOrderTaskId: number

  @ForeignKey(() => ProductionReport)
  @Column({
    comment: '报工单ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare reportId: number

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask

  @BelongsTo(() => ProductionReport)
  declare report: ProductionReport
}
