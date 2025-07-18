import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/sys/user.model'
import { CheckStandardDetail } from '@model/em/checkStandardDetail.model'
import { InspectionPlanDetail } from '@model/em/inspectionPlanDetail.model'

@Table({ tableName: `em_inspection_plan`, freezeTableName: true, timestamps: true, comment: '巡检计划表' })
export class InspectionPlan extends BaseDate<InspectionPlan> {
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '巡检计划编码',
  })
  declare code: string

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '巡检方案名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    comment: '巡检频率',
  })
  declare frequency: string

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '当天规定巡检次数',
  })
  declare times: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    comment: '状态',
    defaultValue: true,
  })
  declare status: boolean

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '备注',
  })
  declare remark: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '创建人',
  })
  declare createdUserId: number

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '更新人',
  })
  declare updatedUserId: number

  @BelongsTo(() => User, 'createdUserId')
  createdUser: User

  @BelongsTo(() => User, 'updatedUserId')
  updatedUser: User

  @HasMany(() => InspectionPlanDetail)
  details: InspectionPlanDetail[]
}
