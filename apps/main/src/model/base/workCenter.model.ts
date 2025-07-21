import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from '@model/auth/user'
import { all } from 'axios'
import { WorkShop } from './workShop.model'
import { Process } from '@model/process/process.model'
/** 车间 */
@Table({ tableName: `base_workcenter`, freezeTableName: true, timestamps: true, comment: '工作中心表' })
export class WorkCenter extends BaseDate<WorkCenter> {
  @Column({
    comment: '工作中心编码',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare code: string

  @Column({
    comment: '工作中心名称',
    type: DataType.STRING(128),
    allowNull: false, // 必填
  })
  declare name: string

  @ForeignKey(() => WorkShop)
  @Column({
    comment: '车间Id',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare workShopId: number

  @ForeignKey(() => Process)
  @Column({
    comment: '工序ID',
    type: DataType.INTEGER,
    allowNull: false, // 必填
  })
  declare processId: number

  @Column({
    comment: '日产能',
    type: DataType.DOUBLE,
    allowNull: true, // 非必填
  })
  declare dailyCapacity: number

  @Column({
    comment: '标准人数',
    type: DataType.INTEGER,
    allowNull: true, // 非必填
  })
  declare standardCount: number

  @Column({
    comment: '状态',
    type: DataType.BOOLEAN,
    allowNull: false, // 必填
  })
  declare status: boolean

  @Column({
    comment: '备注',
    type: DataType.STRING(128),
    allowNull: true, // 非必填
  })
  declare remark: string

  @BelongsTo(() => WorkShop, { foreignKey: 'workShopId', constraints: false, foreignKeyConstraint: false })
  workShop: WorkShop

  @BelongsTo(() => Process, { foreignKey: 'processId', constraints: false, foreignKeyConstraint: false })
  process: Process
}
