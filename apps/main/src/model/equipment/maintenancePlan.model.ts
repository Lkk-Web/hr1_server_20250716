import { BelongsTo, Column, DataType, ForeignKey, HasMany, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user.model'
import { CheckStandardDetail } from '@model/equipment/checkStandardDetail.model'
import { InspectionPlanDetail } from '@model/equipment/inspectionPlanDetail.model'
import { MaintenancePlanDetail } from '@model/equipment/maintenancePlanDetail.model'

@Table({ tableName: `equipment_maintenance_plan`, freezeTableName: true, timestamps: true, comment: '保养计划表' })
export class MaintenancePlan extends BaseDate<MaintenancePlan> {
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: '保养计划编码',
  })
  declare code: string

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '保养方案名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    comment: '保养频率',
  })
  declare frequency: string

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

  @HasMany(() => MaintenancePlanDetail)
  details: MaintenancePlanDetail[]
}
