import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { Material } from '@model/base/material.model'
import { ProductionOrder } from '@model/production/productionOrder.model'
import { Process } from '@model/process/process.model'
import { Organize } from '@model/auth/organize'
import { POP } from '@model/production/POP.model'

@Table({ tableName: `production_POD`, freezeTableName: true, timestamps: true, comment: '生产工单工序关联部门表' })
export class POD extends BaseDate<POD> {
  //工单ID
  @ForeignKey(() => POP)
  @Column({
    comment: '工序任务Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare popId: number

  @ForeignKey(() => Organize)
  @Column({
    comment: '部门ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填项
  })
  declare deptId: number
}
