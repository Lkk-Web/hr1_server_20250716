import { Table, Column, DataType, ForeignKey, HasMany, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { ProductionProcessTask } from '@model/production/productionProcessTask.model'
import { WorkShop } from '../base/workShop.model'
import { ProductionOrderTask } from '@model/production/productionOrderTask.model'
import { Process } from '@model/process/process.model'
/** 车间 */
@Table({ tableName: `production_POP_schedule`, freezeTableName: true, timestamps: true, comment: '工序工单排程表' })
export class POPSchedule extends BaseDate<POPSchedule> {
  @ForeignKey(() => Process)
  @Column({
    comment: '工序Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare processId: number

  @ForeignKey(() => ProductionOrderTask)
  @Column({
    comment: '工单Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare productionOrderTaskId: number

  // 计划开始时间
  @Column({
    comment: '计划开始时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare startTime: Date

  // 计划结束时间
  @Column({
    comment: '计划结束时间',
    type: DataType.DATE,
    allowNull: false,
  })
  declare endTime: Date

  @BelongsTo(() => Process)
  declare process: Process

  @BelongsTo(() => ProductionOrderTask)
  declare productionOrderTask: ProductionOrderTask
}
