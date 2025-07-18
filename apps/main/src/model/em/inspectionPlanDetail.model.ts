import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandard } from '@model/em/checkStandard.model'
import { InspectionPlan } from '@model/em/inspectionPlan.model'

@Table({ tableName: `em_inspection_plan_detail`, freezeTableName: true, timestamps: true, comment: '巡检方案明细表' })
export class InspectionPlanDetail extends BaseDate<InspectionPlanDetail> {
  @ForeignKey(() => InspectionPlan)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '巡检方案Id',
  })
  declare inspectionPlanId: number

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '检查项名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '点检方法',
  })
  declare method: string

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最小值',
  })
  declare min: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最大值',
  })
  declare max: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    comment: '状态',
    defaultValue: true,
  })
  declare status: boolean
}
