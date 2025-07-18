import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { MaintenancePlan } from '@model/em/maintenancePlan.model'

@Table({ tableName: `em_maintenance_plan_detail`, freezeTableName: true, timestamps: true, comment: '保养方案明细表' })
export class MaintenancePlanDetail extends BaseDate<MaintenancePlanDetail> {
  @ForeignKey(()=>MaintenancePlan)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '保养方案Id',
  })
  declare maintenancePlanId: number

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '保养项名称',
  })
  declare name: string

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '保养方法',
  })
  declare method: string

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
    comment: '类型',
  })
  declare type: string




}
